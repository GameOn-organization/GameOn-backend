# Correção do Erro 401 nos Endpoints de Autenticação

## Problema Identificado

A API em produção (`https://api-m2z4unnk3a-uc.a.run.app`) estava retornando erro 401 nos endpoints `/auth/signup` e `/auth/login`.

### Diagnóstico

Através dos logs do Firebase Functions, identificamos dois problemas principais:

1. **Primeiro erro**: Firestore não aceita valores `undefined`

   ```
   Error: Value for argument "data" is not a valid Firestore document. 
   Cannot use "undefined" as a Firestore value (found in field "phone").
   ```
2. **Segundo erro**: Falta de permissão para criar custom tokens

   ```
   FirebaseAuthError: Permission 'iam.serviceAccounts.signBlob' denied on resource
   code: 'auth/insufficient-permission'
   ```

## Soluções Implementadas

### 1. Correção do campo `phone` undefined

**Arquivo**: `src/auth/auth.service.ts`

**Problema**: O código estava tentando salvar `phone: undefined` no Firestore, mas o Firestore não permite valores `undefined`.

**Solução**: Modificamos o método `upsertUserProfile` para só adicionar o campo `phone` se ele tiver valor:

```typescript
if (!profileDoc.exists) {
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
}
```

### 2. Permissão IAM para criar Custom Tokens

**Problema**: A service account `firebase-adminsdk-fbsvc@tcc-gameon.iam.gserviceaccount.com` não tinha permissão para criar custom tokens (necessário para autenticação via email/password).

**Solução**: Adicionar a role "Service Account Token Creator" à service account.

#### Como adicionar a permissão:

**Opção 1: Via Console do Google Cloud**

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/iam-admin/iam?project=tcc-gameon)
2. Encontre a service account: `firebase-adminsdk-fbsvc@tcc-gameon.iam.gserviceaccount.com`
3. Clique em "Editar principal" (ícone de lápis)
4. Clique em "Adicionar outra função"
5. Procure e selecione: **"Service Account Token Creator"** (`roles/iam.serviceAccountTokenCreator`)
6. Clique em "Salvar"

**Opção 2: Via gcloud CLI**

```bash
gcloud projects add-iam-policy-binding tcc-gameon \
  --member="serviceAccount:firebase-adminsdk-fbsvc@tcc-gameon.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountTokenCreator"
```

## Permissões Atuais da Service Account

A service account `firebase-adminsdk-fbsvc@tcc-gameon.iam.gserviceaccount.com` deve ter as seguintes roles:

- ✅ **Administrador de armazenamento** (Storage Admin)
- ✅ **Administrador do Firebase Authentication** (Firebase Authentication Admin)
- ✅ **Agente de serviço administrador do SDK Admin do Firebase** (Firebase Admin SDK Administrator Service Agent)
- ✅ **Criador do token da conta de serviço** (Service Account Token Creator) - já estava presente
- ⚠️ **Service Account Token Creator** (`roles/iam.serviceAccountTokenCreator`) - **PRECISA SER ADICIONADA**

## Teste Após Correção

### Teste 1: Signup com campos obrigatórios

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "email": "novousuario@example.com",
    "password": "senha123",
    "name": "Novo Usuario",
    "age": 28
  }' \
  https://api-m2z4unnk3a-uc.a.run.app/auth/signup
```

**Resposta esperada (sucesso)**:

```json
{
  "message": "User created successfully",
  "user": {
    "uid": "...",
    "email": "novousuario@example.com",
    "name": "Novo Usuario",
    "picture": null,
    "phone": undefined,
    "age": 28
  },
  "customToken": "..."
}
```

### Teste 2: Login

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "email": "novousuario@example.com",
    "password": "senha123"
  }' \
  https://api-m2z4unnk3a-uc.a.run.app/auth/login
```

## Observações Importantes

* **Ambiente Local vs Produção**:

  Local: Usa emuladores do Firebase, não precisa de permissões IAM

  Produção: Usa Application Default Credentials, precisa das permissões corretas
* **Custom Tokens vs ID Tokens**:

  - Backend cria **custom tokens**
  - Frontend deve trocar o custom token por um **ID token** usando `signInWithCustomToken()`
  - ID token é usado para requisições autenticadas
* **Campos Opcionais**:

  - `phone` é opcional no signup
  - `age` é obrigatório no signup (validação do Zod)

## Commits Relacionados

- Correção do campo `phone` undefined no Firestore
- Adição de logs de debug no Firebase provider
- Documentação das permissões IAM necessárias

## Links Úteis

- [Firebase Admin SDK - Create Custom Tokens](https://firebase.google.com/docs/auth/admin/create-custom-tokens)
- [Google Cloud IAM Roles](https://cloud.google.com/iam/docs/understanding-roles)
- [Service Account Token Creator Role](https://cloud.google.com/iam/docs/service-account-permissions#token-creator)
