# API de Posts - GameOn Backend

Este documento descreve todas as rotas disponíveis para gerenciamento de posts no sistema GameOn.

## Base URL

```
/posts
```

## Autenticação

Algumas rotas requerem autenticação através do `AuthGuard`. O token deve ser enviado no header `Authorization` como `Bearer <token>`.

## Entidade Post

```typescript
type Post = {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: Date;
  updatedAt: Date;
  likes: number;
  likedBy: string[];
  comments: number;
  shares: number;
}
```

---

## Rotas Disponíveis

### 1. Criar Post

**POST** `/posts`

Cria um novo post no sistema.

#### Autenticação

✅ **Requerida**

#### Body

```json
{
  "content": "string"
}
```

#### Validações

- `content`: obrigatório, mínimo 1 caractere, máximo 280 caracteres

#### Resposta

```json
{
  "id": "string",
  "content": "string",
  "authorId": "string",
  "authorName": "string",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "likes": 0,
  "likedBy": [],
  "comments": 0,
  "shares": 0
}
```

#### Exemplo

```bash
curl -X POST /posts \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"content": "Meu primeiro post!"}'
```

---

### 2. Listar Posts

**GET** `/posts`

Lista todos os posts com filtros e paginação.

* Autenticação

❌ **Não requerida**

#### Query Parameters

| Parâmetro         | Tipo   | Obrigatório | Padrão       | Descrição                                                     |
| ------------------ | ------ | ------------ | ------------- | --------------------------------------------------------------- |
| `authorId`       | string | Não         | -             | Filtrar por ID do autor                                         |
| `minDate`        | date   | Não         | -             | Data mínima de criação                                       |
| `maxDate`        | date   | Não         | -             | Data máxima de criação                                       |
| `orderBy`        | enum   | Não         | `createdAt` | Campo para ordenação (`createdAt`, `likes`, `comments`) |
| `orderDirection` | enum   | Não         | `desc`      | Direção da ordenação (`asc`, `desc`)                    |
| `limit`          | number | Não         | `20`        | Número máximo de posts (máximo 100)                          |
| `offset`         | number | Não         | `0`         | Número de posts para pular                                     |

#### Resposta

```json
[
  {
    "id": "string",
    "content": "string",
    "authorId": "string",
    "authorName": "string",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "likes": 5,
    "likedBy": ["user1", "user2"],
    "comments": 2,
    "shares": 1
  }
]
```

#### Exemplo

```bash
curl -X GET "/posts?limit=10&orderBy=likes&orderDirection=desc"
```

---

### 3. Listar Meus Posts

**GET** `/posts/my-posts`

Lista apenas os posts do usuário autenticado.

#### Autenticação

✅ **Requerida**

#### Query Parameters

Mesmos parâmetros da rota de listar posts.

#### Resposta

Mesmo formato da rota de listar posts.

#### Exemplo

```bash
curl -X GET "/posts/my-posts?limit=5" \
  -H "Authorization: Bearer <token>"
```

---

### 4. Buscar Post por ID

**GET** `/posts/:id`

Busca um post específico pelo ID.

#### Autenticação

❌ **Não requerida**

#### Parâmetros

| Parâmetro | Tipo   | Obrigatório | Descrição       |
| ---------- | ------ | ------------ | ----------------- |
| `id`     | string | Sim          | ID único do post |

#### Resposta

```json
{
  "id": "string",
  "content": "string",
  "authorId": "string",
  "authorName": "string",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "likes": 5,
  "likedBy": ["user1", "user2"],
  "comments": 2,
  "shares": 1
}
```

#### Erros

- `404 Not Found`: Post não encontrado

#### Exemplo

```bash
curl -X GET "/posts/abc123"
```

---

### 5. Atualizar Post

**PATCH** `/posts/:id`

Atualiza um post existente.

#### Autenticação

✅ **Requerida**

#### Parâmetros

| Parâmetro | Tipo   | Obrigatório | Descrição       |
| ---------- | ------ | ------------ | ----------------- |
| `id`     | string | Sim          | ID único do post |

#### Body

```json
{
  "content": "string"
}
```

#### Validações

- `content`: opcional, mínimo 1 caractere, máximo 280 caracteres

#### Resposta

```json
{
  "id": "string",
  "content": "string",
  "authorId": "string",
  "authorName": "string",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T12:00:00.000Z",
  "likes": 5,
  "likedBy": ["user1", "user2"],
  "comments": 2,
  "shares": 1
}
```

#### Erros

- `400 Bad Request`: Dados de validação inválidos
- `404 Not Found`: Post não encontrado

#### Exemplo

```bash
curl -X PATCH "/posts/abc123" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"content": "Post atualizado!"}'
```

---

### 6. Deletar Post

**DELETE** `/posts/:id`

Remove um post do sistema.

#### Autenticação

✅ **Requerida**

#### Parâmetros

| Parâmetro | Tipo   | Obrigatório | Descrição       |
| ---------- | ------ | ------------ | ----------------- |
| `id`     | string | Sim          | ID único do post |

#### Resposta

```json
{
  "message": "Post deleted successfully"
}
```

#### Erros

- `404 Not Found`: Post não encontrado

#### Exemplo

```bash
curl -X DELETE "/posts/abc123" \
  -H "Authorization: Bearer <token>"
```

---

### 7. Deletar Meu Post

**DELETE** `/posts/my-posts/:id`

Remove um post específico do usuário autenticado (com verificação de propriedade).

#### Autenticação

✅ **Requerida**

#### Parâmetros

| Parâmetro | Tipo   | Obrigatório | Descrição       |
| ---------- | ------ | ------------ | ----------------- |
| `id`     | string | Sim          | ID único do post |

#### Resposta

```json
{
  "message": "Post deleted successfully"
}
```

#### Erros

- `403 Forbidden`: Usuário não é o autor do post
- `404 Not Found`: Post não encontrado

#### Exemplo

```bash
curl -X DELETE "/posts/my-posts/abc123" \
  -H "Authorization: Bearer <token>"
```

---

## Funcionalidades do Serviço

### Like/Unlike de Posts

O serviço inclui funcionalidade para dar like/remover like de posts:

```typescript
async likePost(id: string, uid: string): Promise<Post>
```

- Se o usuário já deu like, remove o like
- Se o usuário não deu like, adiciona o like
- Atualiza automaticamente o contador de likes

---

## Códigos de Status HTTP

| Código | Descrição              |
| ------- | ------------------------ |
| `200` | Sucesso                  |
| `201` | Criado com sucesso       |
| `400` | Dados inválidos         |
| `401` | Não autenticado         |
| `403` | Acesso negado            |
| `404` | Recurso não encontrado  |
| `500` | Erro interno do servidor |

---

## Validações

### CreatePostDto

- `content`: string obrigatória, 1-280 caracteres

### UpdatePostDto

- `content`: string opcional, 1-280 caracteres (quando presente)

### ListPostsQuery

- `authorId`: string opcional, mínimo 1 caractere
- `minDate`: data opcional
- `maxDate`: data opcional
- `orderBy`: enum opcional (`createdAt`, `likes`, `comments`)
- `orderDirection`: enum opcional (`asc`, `desc`)
- `limit`: número opcional, 1-100, padrão 20
- `offset`: número opcional, ≥0, padrão 0

---

## Tecnologias Utilizadas

- **NestJS**: Framework para Node.js
- **Firebase Firestore**: Banco de dados NoSQL
- **Zod**: Validação de schemas
- **TypeScript**: Linguagem de programação
