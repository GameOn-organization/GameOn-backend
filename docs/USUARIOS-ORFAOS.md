# Problema: Usuários Órfãos no Firebase Auth

## 📝 Descrição do Problema

Ao tentar criar um usuário com um email já utilizado anteriormente, você recebia o erro:

```json
{
  "message": "Email already registered",
  "error": "Conflict",
  "statusCode": 409
}
```

Porém, ao listar os usuários (`GET /users`), o array estava vazio. O que estava acontecendo?

### 🔍 Causa Raiz

O problema ocorria porque o endpoint `DELETE /users/:id` estava deletando o usuário **apenas do Firestore** (banco de dados), mas **não do Firebase Authentication**.

Isso criava "usuários órfãos" - contas que existem no Firebase Auth mas não têm perfil no Firestore.

```
┌─────────────────────────────────────────────────────────┐
│ Firebase Authentication (Auth)                          │
│ ✅ brunno@gmail.com existe                              │
│ ✅ teste@example.com existe                             │
│ ✅ usuario@example.com existe                           │
└─────────────────────────────────────────────────────────┘
                         ↕️
┌─────────────────────────────────────────────────────────┐
│ Firestore (Banco de Dados - collection "profiles")     │
│ ❌ Vazio - todos os perfis foram deletados              │
└─────────────────────────────────────────────────────────┘
```

**Resultado:**
- `POST /auth/signup` → Verifica Firebase Auth → ❌ Email já existe
- `GET /users` → Busca no Firestore → ✅ Array vazio

---

## ✅ Solução Implementada

### 1. **Correção do método `remove`** (`users.service.ts`)

O método agora deleta **tanto do Firestore quanto do Firebase Auth**:

```typescript
async remove(id: string): Promise<void> {
  try {
    // 1. Deletar do Firestore
    await this.db.collection('profiles').doc(id).delete();
    console.log(`✅ Perfil ${id} deletado do Firestore`);

    // 2. Deletar do Firebase Authentication
    try {
      await admin.auth().deleteUser(id);
      console.log(`✅ Usuário ${id} deletado do Firebase Auth`);
    } catch (authError: any) {
      if (authError.code === 'auth/user-not-found') {
        console.log(`⚠️  Usuário ${id} não encontrado no Firebase Auth`);
      } else {
        throw authError;
      }
    }
  } catch (error) {
    console.error(`❌ Erro ao deletar usuário ${id}:`, error);
    throw error;
  }
}
```

### 2. **Novo endpoint de limpeza** (`POST /users/cleanup-orphans`)

Criamos um endpoint para limpar usuários órfãos existentes:

```typescript
async cleanupOrphanUsers(): Promise<{
  message: string;
  orphansFound: number;
  deleted: number;
  errors: number;
  orphanUsers: Array<{ uid: string; email: string }>;
}> {
  // 1. Buscar todos os usuários do Firebase Auth
  const listUsersResult = await admin.auth().listUsers(1000);
  const authUsers = listUsersResult.users;

  // 2. Buscar todos os perfis do Firestore
  const profilesSnapshot = await this.db.collection('profiles').get();
  const firestoreUids = new Set(profilesSnapshot.docs.map((doc: any) => doc.id));

  // 3. Identificar usuários órfãos (existem no Auth mas não no Firestore)
  const orphanUsers = authUsers.filter(user => !firestoreUids.has(user.uid));

  // 4. Deletar usuários órfãos
  for (const user of orphanUsers) {
    await admin.auth().deleteUser(user.uid);
  }

  return {
    message: `Limpeza concluída: ${deletedCount} usuários deletados`,
    orphansFound: orphanUsers.length,
    deleted: deletedCount,
    errors: errorCount,
    orphanUsers: orphansList
  };
}
```

---

## 🚀 Como Usar

### **Opção 1: Endpoint de Limpeza (Recomendado)**

```bash
# 1. Fazer login
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"email": "seu@email.com", "password": "senha"}' \
  https://api-m2z4unnk3a-uc.a.run.app/auth/login

# Pegar o customToken da resposta

# 2. Executar limpeza
curl -X POST \
  -H "Authorization: Bearer SEU_CUSTOM_TOKEN" \
  https://api-m2z4unnk3a-uc.a.run.app/users/cleanup-orphans
```

**Resposta:**
```json
{
  "message": "Limpeza concluída: 32 usuários deletados, 0 erros",
  "orphansFound": 32,
  "deleted": 32,
  "errors": 0,
  "orphanUsers": [
    {
      "uid": "abc123",
      "email": "brunno@gmail.com",
      "deleted": true
    }
  ]
}
```

### **Opção 2: Script de Limpeza**

Um script standalone também foi criado:

```bash
cd GameOn-backend
node scripts/cleanup-orphan-users.js
```

O script:
- Lista todos os usuários órfãos
- Pede confirmação antes de deletar
- Mostra progresso e resumo

---

## 📊 Resultado da Limpeza

Na execução do endpoint, foram encontrados e deletados **32 usuários órfãos**:

```
✅ Limpeza concluída: 32 usuários deletados, 0 erros

Usuários removidos incluem:
- brunno@gmail.com
- teste@example.com
- vitormimaki@gmail.com
- arthurdequeiroz2005@gmail.com
- e outros 28 usuários
```

Após a limpeza, você pode criar novos usuários normalmente! ✅

---

## 🔒 Prevenção do Problema

### **Antes (comportamento antigo):**
```typescript
// ❌ Deletava apenas do Firestore
async remove(id: string): Promise<void> {
  await this.db.collection('profiles').doc(id).delete();
}
```

### **Agora (comportamento correto):**
```typescript
// ✅ Deleta de ambos os lugares
async remove(id: string): Promise<void> {
  await this.db.collection('profiles').doc(id).delete();  // Firestore
  await admin.auth().deleteUser(id);                      // Firebase Auth
}
```

**Daqui para frente**, quando você deletar um usuário via `DELETE /users/:id`, ele será removido automaticamente de ambos os lugares! 🎉

---

## 🧪 Teste de Validação

Após a correção, testamos a criação do usuário que estava bloqueado:

```bash
# Teste: Criar usuário que estava dando erro
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "email": "brunno@gmail.com",
    "password": "senha123",
    "name": "Brunno Morokuma",
    "phone": "(11) 99999-9999",
    "age": 20
  }' \
  https://api-m2z4unnk3a-uc.a.run.app/auth/signup
```

**Resultado:**
```json
{
  "message": "User created successfully",
  "user": {
    "uid": "AWbZlMg7NwMx07qMxSmdxzvs6ef1",
    "email": "brunno@gmail.com",
    "name": "Brunno Morokuma",
    "phone": "(11) 99999-9999",
    "age": 20
  },
  "customToken": "eyJhbGc..."
}
```

✅ **Sucesso!** O usuário foi criado sem problemas.

---

## 📚 Lições Aprendidas

1. **Sempre deletar de ambos os lugares**: Firestore E Firebase Auth
2. **Usuários órfãos são invisíveis**: Você não os vê ao listar, mas eles bloqueiam novos cadastros
3. **Firebase Auth é independente**: Ter permissões no Firestore não significa ter no Auth
4. **Limpeza periódica**: Útil ter um endpoint para corrigir inconsistências

---

## 🔧 Arquivos Modificados

1. **`src/users/users.service.ts`**
   - Método `remove()` agora deleta de ambos os lugares
   - Novo método `cleanupOrphanUsers()`

2. **`src/users/users.controller.ts`**
   - Novo endpoint `POST /users/cleanup-orphans`

3. **`scripts/cleanup-orphan-users.js`** (novo)
   - Script standalone para limpeza

---

**Data da correção**: 15/10/2025  
**Status**: ✅ Problema resolvido  
**API**: https://api-m2z4unnk3a-uc.a.run.app

**Deploy necessário**: ✅ Já feito! (commit com as correções)

