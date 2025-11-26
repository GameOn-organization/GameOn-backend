# API de Comentários - GameOn Backend

Este documento descreve todas as rotas disponíveis para gerenciamento de comentários no sistema GameOn.

## Base URL

```
/comments
```

## Autenticação

Algumas rotas requerem autenticação através do `AuthGuard`. O token deve ser enviado no header `Authorization` como `Bearer <token>`.

## Entidade Comment

```typescript
type Comment = {
  id: string;
  postId: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: Date;
  updatedAt: Date;
  likes: number;
  likedBy: string[];
}
```

---

## Rotas Disponíveis

### 1. Criar Comentário

**POST** `/comments`

Cria um novo comentário em um post.

#### Autenticação

✅ **Requerida**

#### Body

```json
{
  "postId": "string",
  "content": "string"
}
```

#### Validações

- `postId`: obrigatório, mínimo 1 caractere
- `content`: obrigatório, mínimo 1 caractere, máximo 500 caracteres

#### Resposta

```json
{
  "id": "string",
  "postId": "string",
  "content": "string",
  "authorId": "string",
  "authorName": "string",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "likes": 0,
  "likedBy": []
}
```

#### Funcionalidade Extra

- Incrementa automaticamente o contador de comentários no post
- Verifica se o post existe antes de criar o comentário

---

### 2. Listar Comentários de um Post

**GET** `/comments?postId={postId}`

Lista todos os comentários de um post específico.

#### Autenticação

❌ **Não requerida**

#### Query Parameters

| Parâmetro | Tipo   | Obrigatório | Descrição                    |
| --------- | ------ | ----------- | ---------------------------- |
| `postId`  | string | **Sim**     | ID do post para buscar comentários |

#### Resposta

```json
[
  {
    "id": "string",
    "postId": "string",
    "content": "string",
    "authorId": "string",
    "authorName": "string",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "likes": 2,
    "likedBy": ["user1", "user2"]
  }
]
```

#### Ordenação

Comentários são retornados ordenados por `createdAt` **descendente** (mais recentes primeiro).

#### Erros

- `400 Bad Request`: postId não fornecido

---

### 3. Buscar Comentário por ID

**GET** `/comments/:id`

Busca um comentário específico pelo ID.

#### Autenticação

❌ **Não requerida**

#### Parâmetros

| Parâmetro | Tipo   | Obrigatório | Descrição              |
| --------- | ------ | ----------- | ---------------------- |
| `id`      | string | Sim         | ID único do comentário |

#### Resposta

```json
{
  "id": "string",
  "postId": "string",
  "content": "string",
  "authorId": "string",
  "authorName": "string",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "likes": 0,
  "likedBy": []
}
```

#### Erros

- `404 Not Found`: Comentário não encontrado

---

### 4. Atualizar Comentário

**PATCH** `/comments/:id`

Atualiza o conteúdo de um comentário existente.

#### Autenticação

✅ **Requerida**

#### Parâmetros

| Parâmetro | Tipo   | Obrigatório | Descrição              |
| --------- | ------ | ----------- | ---------------------- |
| `id`      | string | Sim         | ID único do comentário |

#### Body

```json
{
  "content": "string"
}
```

#### Validações

- `content`: opcional, mínimo 1 caractere, máximo 500 caracteres
- Usuário deve ser o autor do comentário

#### Resposta

```json
{
  "id": "string",
  "postId": "string",
  "content": "string (atualizado)",
  "authorId": "string",
  "authorName": "string",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T12:00:00.000Z",
  "likes": 0,
  "likedBy": []
}
```

#### Erros

- `400 Bad Request`: Dados de validação inválidos
- `403 Forbidden`: Tentativa de atualizar comentário de outro usuário
- `404 Not Found`: Comentário não encontrado

---

### 5. Deletar Comentário

**DELETE** `/comments/:id`

Remove um comentário do sistema.

#### Autenticação

✅ **Requerida**

#### Parâmetros

| Parâmetro | Tipo   | Obrigatório | Descrição              |
| --------- | ------ | ----------- | ---------------------- |
| `id`      | string | Sim         | ID único do comentário |

#### Resposta

```
Status 200 OK (sem body)
```

#### Funcionalidade Extra

- Decrementa automaticamente o contador de comentários no post
- Usuário deve ser o autor do comentário

#### Erros

- `403 Forbidden`: Tentativa de deletar comentário de outro usuário
- `404 Not Found`: Comentário não encontrado

---

### 6. Like/Unlike Comentário

**POST** `/comments/:id/like`

Dá like ou remove like de um comentário (toggle).

#### Autenticação

✅ **Requerida**

#### Parâmetros

| Parâmetro | Tipo   | Obrigatório | Descrição              |
| --------- | ------ | ----------- | ---------------------- |
| `id`      | string | Sim         | ID único do comentário |

#### Resposta

```json
{
  "id": "string",
  "postId": "string",
  "content": "string",
  "authorId": "string",
  "authorName": "string",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T12:00:00.000Z",
  "likes": 1,
  "likedBy": ["currentUserId"]
}
```

#### Comportamento

- Se o usuário já deu like: **remove** o like
- Se o usuário não deu like: **adiciona** o like
- Atualiza automaticamente o contador de likes

#### Erros

- `404 Not Found`: Comentário não encontrado

---

## Índice Firestore Necessário

Para que a query de listar comentários funcione, é necessário criar um **índice composto**:

**Collection**: `comments`  
**Fields**:
- `postId`: Ascending
- `createdAt`: Descending

**Link para criar**: [Criar Índice](https://console.firebase.google.com/v1/r/project/tcc-gameon/firestore/indexes?create_composite=Cktwcm9qZWN0cy90Y2MtZ2FtZW9uL2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9jb21tZW50cy9pbmRleGVzL18QARoKCgZwb3N0SWQQARoNCgljcmVhdGVkQXQQAhoMCghfX25hbWVfXxAC)

---

## Códigos de Status HTTP

| Código | Descrição                  |
| ------ | -------------------------- |
| `200`  | Sucesso                    |
| `201`  | Criado com sucesso         |
| `400`  | Dados inválidos            |
| `401`  | Não autenticado            |
| `403`  | Acesso negado              |
| `404`  | Recurso não encontrado     |
| `500`  | Erro interno do servidor   |

---

## Exemplos de Uso

### Criar comentário

```bash
curl -X POST /comments \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "postId": "abc123",
    "content": "Ótimo post!"
  }'
```

### Listar comentários de um post

```bash
curl -X GET "/comments?postId=abc123"
```

### Dar like em um comentário

```bash
curl -X POST /comments/xyz789/like \
  -H "Authorization: Bearer <token>"
```

---

## Tecnologias Utilizadas

- **NestJS**: Framework para Node.js
- **Firebase Firestore**: Banco de dados NoSQL
- **Zod**: Validação de schemas
- **TypeScript**: Linguagem de programação

