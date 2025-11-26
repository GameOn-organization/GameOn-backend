# Índices do Firestore para Posts e Comentários

## Problema Identificado

Ao fazer queries no Firestore que combinam **filtros** e **ordenação**, é necessário criar **índices compostos**.

## Erro Original

```
Error: 9 FAILED_PRECONDITION: The query requires an index.
```

Isso ocorre porque o Firestore não pode executar queries complexas sem índices adequados.

## Índices Necessários

### 1. Índice para `my-posts` (authorId + createdAt)

**Query**: Buscar posts de um usuário ordenados por data de criação

```typescript
ref.where('authorId', '==', userId)
   .orderBy('createdAt', 'desc')
```

**Índice necessário**:
- Collection: `posts`
- Fields:
  - `authorId`: Ascending
  - `createdAt`: Descending

**Link direto**: 
```
https://console.firebase.google.com/v1/r/project/tcc-gameon/firestore/indexes?create_composite=Ckhwcm9qZWN0cy90Y2MtZ2FtZW9uL2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9wb3N0cy9pbmRleGVzL18QARoMCghhdXRob3JJZBABGg0KCWNyZWF0ZWRBdBACGgwKCF9fbmFtZV9fEAI
```

---

### 2. Índice para posts por likes (authorId + likes)

**Query**: Buscar posts de um usuário ordenados por número de likes

```typescript
ref.where('authorId', '==', userId)
   .orderBy('likes', 'desc')
```

**Índice necessário**:
- Collection: `posts`
- Fields:
  - `authorId`: Ascending
  - `likes`: Descending

---

### 3. Índice para posts por comentários (authorId + comments)

**Query**: Buscar posts de um usuário ordenados por número de comentários

```typescript
ref.where('authorId', '==', userId)
   .orderBy('comments', 'desc')
```

**Índice necessário**:
- Collection: `posts`
- Fields:
  - `authorId`: Ascending
  - `comments`: Descending

---

## Índices para Comentários

### 1. Índice para comentários por post (postId + createdAt)

**Query**: Buscar comentários de um post ordenados por data

```typescript
ref.where('postId', '==', postId)
   .orderBy('createdAt', 'desc')
```

**Índice necessário**:
- Collection: `comments`
- Fields:
  - `postId`: Ascending
  - `createdAt`: Descending

**Link direto**: 
```
https://console.firebase.google.com/v1/r/project/tcc-gameon/firestore/indexes?create_composite=Cktwcm9qZWN0cy90Y2MtZ2FtZW9uL2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9jb21tZW50cy9pbmRleGVzL18QARoKCgZwb3N0SWQQARoNCgljcmVhdGVkQXQQAhoMCghfX25hbWVfXxAC
```

---

## Como Criar os Índices

### Opção 1: Automático (Recomendado)

Quando você executar uma query que precisa de índice, o Firestore retornará um link no erro. Basta:
1. Copiar o link do erro
2. Abrir no navegador
3. Clicar em "Create Index"
4. Aguardar alguns minutos para o índice ser criado

### Opção 2: Manual

1. Acesse: https://console.firebase.google.com/project/tcc-gameon/firestore/indexes
2. Clique em **"Create Index"**
3. Selecione a collection: `posts`
4. Adicione os campos conforme descrito acima
5. Clique em **"Create"**
6. Aguarde a criação do índice (pode levar alguns minutos)

---

## Status dos Índices

### Posts

| Query | Campos | Status | Link |
|-------|--------|--------|------|
| my-posts (createdAt) | authorId + createdAt DESC | ✅ CRIADO | [Criar](https://console.firebase.google.com/v1/r/project/tcc-gameon/firestore/indexes?create_composite=Ckhwcm9qZWN0cy90Y2MtZ2FtZW9uL2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9wb3N0cy9pbmRleGVzL18QARoMCghhdXRob3JJZBABGg0KCWNyZWF0ZWRBdBACGgwKCF9fbmFtZV9fEAI) |
| my-posts (likes) | authorId + likes DESC | ⚠️ NECESSÁRIO | - |
| my-posts (comments) | authorId + comments DESC | ⚠️ NECESSÁRIO | - |

### Comentários

| Query | Campos | Status | Link |
|-------|--------|--------|------|
| comments-by-post | postId + createdAt DESC | ⚠️ NECESSÁRIO | [Criar](https://console.firebase.google.com/v1/r/project/tcc-gameon/firestore/indexes?create_composite=Cktwcm9qZWN0cy90Y2MtZ2FtZW9uL2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9jb21tZW50cy9pbmRleGVzL18QARoKCgZwb3N0SWQQARoNCgljcmVhdGVkQXQQAhoMCghfX25hbWVfXxAC) |

---

## Queries que NÃO precisam de índice

- Queries simples sem filtros: `GET /posts` (só ordenação)
- Queries com apenas 1 campo: `where('authorId', '==', userId)` sem ordenação extra

---

## Solução do Erro 500

O erro 500 que estava ocorrendo era causado pela **falta do índice composto** para a query `authorId + createdAt`.

**Solução**: Criar o índice conforme instruções acima.

Após criar o índice, aguarde alguns minutos e teste novamente:

```bash
http GET https://us-central1-tcc-gameon.cloudfunctions.net/api/posts/my-posts \
  "Authorization:Bearer <seu-token>"
```

---

## Testando os Índices

Depois de criar os índices, você pode testar com:

```bash
# Login
http POST https://us-central1-tcc-gameon.cloudfunctions.net/api/auth/login \
  email="desire@gmail.com" \
  password="senha123456"

# Obter idToken (usando script test-get-token.js)
node test-get-token.js "<customToken>"

# Testar query
http GET "https://us-central1-tcc-gameon.cloudfunctions.net/api/posts/my-posts?orderBy=createdAt&orderDirection=desc" \
  "Authorization:Bearer <idToken>"
```

---

## Notas

- Os índices levam alguns minutos para serem criados
- O status pode ser verificado no Firebase Console
- Índices consomem armazenamento no Firestore (incluído no plano gratuito)
- É recomendado criar apenas os índices que você realmente usa

