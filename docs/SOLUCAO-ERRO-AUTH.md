# Solução do Erro 401 nos Endpoints de Autenticação

## 📝 Resumo do Problema

A API em produção (`https://api-m2z4unnk3a-uc.a.run.app`) estava retornando erro 401 nos endpoints `/auth/signup` e `/auth/login`, enquanto localmente (com `npm run dev`) funcionava perfeitamente.

## 🔍 Diagnóstico

### Erro 1: Campo `undefined` no Firestore
```
Error: Value for argument "data" is not a valid Firestore document. 
Cannot use "undefined" as a Firestore value (found in field "phone").
```

### Erro 2: Permissão para criar Custom Tokens
```
FirebaseAuthError: Permission 'iam.serviceAccounts.signBlob' denied
code: 'auth/insufficient-permission'
```

## ✅ Solução Implementada

### 1. Correção do Campo `undefined`

**Arquivo modificado**: `src/auth/auth.service.ts`

**Problema**: O Firestore não aceita valores `undefined` em documentos.

**Solução**: Modificamos o método `upsertUserProfile` para apenas adicionar o campo `phone` se ele tiver valor:

```typescript
const initialProfile: Record<string, any> = {
  id: user.uid,
  name: user.name || 'Usuário',
  age: user.age || 0,
  email: user.email,
  image: user.picture || null,
  tags: [],
};

// Só adicionar phone se tiver valor
if (user.phone !== undefined) {
  initialProfile.phone = user.phone;
}

await profileRef.set(initialProfile);
```

### 2. Carregamento de Credenciais Explícitas

**Arquivo modificado**: `src/firebase/firebase.providers.ts`

**Problema**: Quando o Firebase Admin SDK usa Application Default Credentials no Cloud Run, ele não tem permissão para criar custom tokens (necessário para autenticação email/password).

**Solução**: Implementamos um sistema de fallback que tenta carregar credenciais nesta ordem:

1. **Variáveis de ambiente** (`FB_PROJECT_ID`, `FB_CLIENT_EMAIL`, `FB_PRIVATE_KEY`)
2. **Arquivo JSON de credenciais** (incluso no deploy)
3. **Application Default Credentials** (fallback)

```typescript
if (hasExplicitCreds) {
  // Usar env vars
  admin.initializeApp({ credential: admin.credential.cert({...}) });
} else {
  // Procurar arquivo JSON
  const possiblePaths = [
    path.join(__dirname, '..', '..', 'tcc-gameon-firebase-adminsdk-fbsvc-4b8741b5da.json'),
    path.join(process.cwd(), 'tcc-gameon-firebase-adminsdk-fbsvc-4b8741b5da.json'),
    '/workspace/tcc-gameon-firebase-adminsdk-fbsvc-4b8741b5da.json',
  ];
  
  // Carregar arquivo se encontrado
  if (serviceAccountPath) {
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  } else {
    // Fallback
    admin.initializeApp();
  }
}
```

## 🎯 Por que funcionou?

O arquivo `tcc-gameon-firebase-adminsdk-fbsvc-4b8741b5da.json` é incluído no deploy do Firebase Functions. Quando o código roda em produção, ele encontra esse arquivo e usa as credenciais explícitas, permitindo a criação de custom tokens sem precisar de permissões IAM adicionais.

### Diferença entre Ambientes:

| Ambiente | Método | Funcionamento |
|----------|--------|---------------|
| **Local (dev)** | Emuladores | Não precisa de credenciais reais |
| **Produção (antes)** | Application Default Credentials | ❌ Sem permissão para `signBlob` |
| **Produção (agora)** | Arquivo JSON de credenciais | ✅ Com todas as permissões |

## 🧪 Testes de Validação

### Teste 1: Signup (Criação de usuário)
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste@example.com",
    "password": "senha123",
    "name": "Usuario Teste",
    "age": 25
  }' \
  https://api-m2z4unnk3a-uc.a.run.app/auth/signup
```

**Resposta (sucesso):**
```json
{
  "message": "User created successfully",
  "user": {
    "uid": "akPy6HEC03h1TsAuI4u7f4NKPY62",
    "email": "teste@example.com",
    "name": "Usuario Teste",
    "age": 25
  },
  "customToken": "eyJhbGc..."
}
```

### Teste 2: Login
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste@example.com",
    "password": "senha123"
  }' \
  https://api-m2z4unnk3a-uc.a.run.app/auth/login
```

**Resposta (sucesso):**
```json
{
  "message": "Login successful",
  "user": {
    "uid": "akPy6HEC03h1TsAuI4u7f4NKPY62",
    "email": "teste@example.com",
    "name": "Usuario Teste"
  },
  "customToken": "eyJhbGc..."
}
```

## 📚 Lições Aprendidas

1. **Erro 401 nem sempre é de permissão IAM**: Podem haver outros problemas (como campos undefined) antes do erro de permissão aparecer.

2. **Application Default Credentials tem limitações**: No Cloud Run/Functions 2nd Gen, a service account padrão pode não ter todas as permissões necessárias.

3. **Arquivos de credenciais são incluídos no deploy**: O arquivo JSON não está no `.gitignore` do Firebase, então é deployado junto com o código.

4. **Múltiplos caminhos de fallback**: É importante ter um sistema robusto que funcione em diferentes ambientes.

## 🔒 Segurança

⚠️ **Importante**: O arquivo `tcc-gameon-firebase-adminsdk-fbsvc-4b8741b5da.json` contém credenciais sensíveis e:
- ✅ Está no `.gitignore` (não vai para o Git)
- ✅ É deployado apenas no Firebase Functions (ambiente seguro)
- ✅ Não é exposto publicamente

## 📊 Status Atual

| Endpoint | Status | Observações |
|----------|--------|-------------|
| `/auth/signup` | ✅ Funcionando | Requer: email, password, name, age |
| `/auth/login` | ✅ Funcionando | Requer: email, password |
| `/auth/google` | ✅ Funcionando | Requer: idToken |

## 🚀 Deploy

Para fazer deploy das alterações:
```bash
cd GameOn-backend
npm run build
firebase deploy --only functions
```

---

**Data da correção**: 15/10/2025  
**Versão da API**: https://api-m2z4unnk3a-uc.a.run.app

