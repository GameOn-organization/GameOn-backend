# API de Conversas e Mensagens

Documentação completa das rotas de conversas e mensagens do GameOn Backend.

## Índice

1. [Conversas](#conversas)
   - [Criar Conversa](#criar-conversa)
   - [Listar Conversas](#listar-conversas)
   - [Buscar Conversa por ID](#buscar-conversa-por-id)
   - [Atualizar Conversa](#atualizar-conversa)
   - [Deletar Conversa](#deletar-conversa)
2. [Mensagens](#mensagens)
   - [Criar Mensagem](#criar-mensagem)
   - [Listar Mensagens](#listar-mensagens)
   - [Buscar Mensagem por ID](#buscar-mensagem-por-id)
   - [Marcar Mensagem como Lida](#marcar-mensagem-como-lida)
   - [Atualizar Mensagem](#atualizar-mensagem)
   - [Deletar Mensagem](#deletar-mensagem)

---

## Conversas

### Criar Conversa

Cria uma nova conversa entre participantes.

**Endpoint:** `POST /conversations`

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "participantes": ["user1", "user2"],
  "lastMessage": {
    "text": "Olá! Como vai?",
    "senderId": "user1",
    "timestamp": "2025-10-24T10:00:00.000Z"
  },
  "createdAt": "2025-10-24T10:00:00.000Z"  // Opcional
}
```

**Validações:**
- `participantes`: Array de strings com pelo menos 2 participantes
- `lastMessage.text`: String não vazia
- `lastMessage.senderId`: String não vazia
- `lastMessage.timestamp`: Data válida (ISO 8601)
- `createdAt`: Data válida (opcional, padrão: data atual)

**Resposta de Sucesso (200):**
```json
{
  "id": "conv_1761266249615_1",
  "participants": ["user1", "user2"],
  "lastMessage": {
    "text": "Olá! Como vai?",
    "senderId": "user1",
    "timestamp": "2025-10-24T10:00:00.000Z"
  },
  "createdAt": "2025-10-24T00:37:29.614Z"
}
```

**Resposta de Erro (400):**
```json
{
  "message": "Validation failed",
  "fieldErrors": {
    "participantes": ["A conversa deve ter pelo menos 2 participantes"],
    "lastMessage": [
      "A mensagem não pode estar vazia",
      "O Id de quem enviou a mensagem é obrigatório"
    ]
  },
  "formErrors": []
}
```

**Exemplo de Requisição:**
```bash
curl -X POST http://localhost:3000/conversations \
  -H "Content-Type: application/json" \
  -d '{
    "participantes": ["user1", "user2"],
    "lastMessage": {
      "text": "Olá! Como vai?",
      "senderId": "user1",
      "timestamp": "2025-10-24T10:00:00.000Z"
    }
  }'
```

---

### Listar Conversas

Lista todas as conversas ou filtra por participante.

**Endpoint:** `GET /conversations`

**Query Parameters (opcionais):**
- `participantId`: ID do participante para filtrar conversas

**Resposta de Sucesso (200):**
```json
[
  {
    "id": "conv_1761266249615_1",
    "participants": ["user1", "user2"],
    "lastMessage": {
      "text": "Olá! Como vai?",
      "senderId": "user1",
      "timestamp": "2025-10-24T10:00:00.000Z"
    },
    "createdAt": "2025-10-24T00:37:29.614Z"
  }
]
```

**Exemplos de Requisição:**

Listar todas as conversas:
```bash
curl -X GET http://localhost:3000/conversations
```

Filtrar conversas de um participante:
```bash
curl -X GET "http://localhost:3000/conversations?participantId=user1"
```

---

### Buscar Conversa por ID

Busca uma conversa específica pelo ID.

**Endpoint:** `GET /conversations/:id`

**Path Parameters:**
- `id`: ID da conversa

**Resposta de Sucesso (200):**
```json
{
  "id": "conv_1761266249615_1",
  "participants": ["user1", "user2"],
  "lastMessage": {
    "text": "Olá! Como vai?",
    "senderId": "user1",
    "timestamp": "2025-10-24T10:00:00.000Z"
  },
  "createdAt": "2025-10-24T00:37:29.614Z"
}
```

**Resposta de Erro (404):**
```json
{
  "message": "Conversa com ID conv_inexistente não encontrada",
  "error": "Not Found",
  "statusCode": 404
}
```

**Exemplo de Requisição:**
```bash
curl -X GET http://localhost:3000/conversations/conv_1761266249615_1
```

---

### Atualizar Conversa

Atualiza informações de uma conversa existente.

**Endpoint:** `PATCH /conversations/:id`

**Path Parameters:**
- `id`: ID da conversa

**Headers:**
```
Content-Type: application/json
```

**Body (todos os campos são opcionais):**
```json
{
  "participantes": ["user1", "user2", "user3"],
  "lastMessage": {
    "text": "Última mensagem atualizada!",
    "senderId": "user2",
    "timestamp": "2025-10-24T12:00:00.000Z"
  }
}
```

**Resposta de Sucesso (200):**
```json
{
  "id": "conv_1761266249615_1",
  "participants": ["user1", "user2", "user3"],
  "lastMessage": {
    "text": "Última mensagem atualizada!",
    "senderId": "user2",
    "timestamp": "2025-10-24T12:00:00.000Z"
  },
  "createdAt": "2025-10-24T00:37:29.614Z"
}
```

**Resposta de Erro (404):**
```json
{
  "message": "Conversa com ID conv_inexistente não encontrada",
  "error": "Not Found",
  "statusCode": 404
}
```

**Exemplo de Requisição:**
```bash
curl -X PATCH http://localhost:3000/conversations/conv_1761266249615_1 \
  -H "Content-Type: application/json" \
  -d '{
    "lastMessage": {
      "text": "Última mensagem atualizada!",
      "senderId": "user2",
      "timestamp": "2025-10-24T12:00:00.000Z"
    }
  }'
```

---

### Deletar Conversa

Deleta uma conversa existente.

**Endpoint:** `DELETE /conversations/:id`

**Path Parameters:**
- `id`: ID da conversa

**Resposta de Sucesso (200):**
```
(Sem conteúdo)
```

**Resposta de Erro (404):**
```json
{
  "message": "Conversa com ID conv_inexistente não encontrada",
  "error": "Not Found",
  "statusCode": 404
}
```

**Exemplo de Requisição:**
```bash
curl -X DELETE http://localhost:3000/conversations/conv_1761266249615_1
```

---

## Mensagens

### Criar Mensagem

Cria uma nova mensagem em uma conversa.

**Endpoint:** `POST /messages`

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "conversationId": "conv_1761266249615_1",
  "senderId": "user1",
  "text": "Olá! Como vai?",
  "timeStamp": "2025-10-24T10:00:00.000Z",  // Opcional
  "read": false  // Opcional, padrão: false
}
```

**Validações:**
- `conversationId`: String não vazia
- `senderId`: String não vazia
- `text`: String não vazia
- `timeStamp`: Data válida (opcional, padrão: data atual)
- `read`: Booleano (opcional, padrão: false)

**Resposta de Sucesso (200):**
```json
{
  "id": "msg_1761266340456_1",
  "conversationId": "conv_1761266249615_1",
  "senderId": "user1",
  "text": "Olá! Como vai?",
  "timeStamp": "2025-10-24T00:39:00.456Z",
  "read": false
}
```

**Resposta de Erro (400):**
```json
{
  "message": "Validation failed",
  "fieldErrors": {
    "conversationId": ["O id da conversa é obrigatório"],
    "senderId": ["o id de quem enviou a mensagem é obrigatório"],
    "text": ["A mensagem não pode estar vazia"]
  },
  "formErrors": []
}
```

**Exemplo de Requisição:**
```bash
curl -X POST http://localhost:3000/messages \
  -H "Content-Type: application/json" \
  -d '{
    "conversationId": "conv_1761266249615_1",
    "senderId": "user1",
    "text": "Olá! Como vai?"
  }'
```

---

### Listar Mensagens

Lista todas as mensagens ou filtra por conversa ou remetente.

**Endpoint:** `GET /messages`

**Query Parameters (opcionais):**
- `conversationId`: ID da conversa para filtrar mensagens
- `senderId`: ID do remetente para filtrar mensagens

**Resposta de Sucesso (200):**
```json
[
  {
    "id": "msg_1761266340456_1",
    "conversationId": "conv_1761266249615_1",
    "senderId": "user1",
    "text": "Olá! Como vai?",
    "timeStamp": "2025-10-24T00:39:00.456Z",
    "read": true
  },
  {
    "id": "msg_1761266346878_2",
    "conversationId": "conv_1761266249615_1",
    "senderId": "user2",
    "text": "Tudo bem! E você?",
    "timeStamp": "2025-10-24T00:39:06.878Z",
    "read": false
  }
]
```

**Exemplos de Requisição:**

Listar todas as mensagens:
```bash
curl -X GET http://localhost:3000/messages
```

Filtrar mensagens de uma conversa:
```bash
curl -X GET "http://localhost:3000/messages?conversationId=conv_1761266249615_1"
```

Filtrar mensagens de um remetente:
```bash
curl -X GET "http://localhost:3000/messages?senderId=user1"
```

---

### Buscar Mensagem por ID

Busca uma mensagem específica pelo ID.

**Endpoint:** `GET /messages/:id`

**Path Parameters:**
- `id`: ID da mensagem

**Resposta de Sucesso (200):**
```json
{
  "id": "msg_1761266340456_1",
  "conversationId": "conv_1761266249615_1",
  "senderId": "user1",
  "text": "Olá! Como vai?",
  "timeStamp": "2025-10-24T00:39:00.456Z",
  "read": true
}
```

**Resposta de Erro (404):**
```json
{
  "message": "Mensagem com ID msg_inexistente não encontrada",
  "error": "Not Found",
  "statusCode": 404
}
```

**Exemplo de Requisição:**
```bash
curl -X GET http://localhost:3000/messages/msg_1761266340456_1
```

---

### Marcar Mensagem como Lida

Marca uma mensagem como lida.

**Endpoint:** `PATCH /messages/:id/read`

**Path Parameters:**
- `id`: ID da mensagem

**Resposta de Sucesso (200):**
```json
{
  "id": "msg_1761266340456_1",
  "conversationId": "conv_1761266249615_1",
  "senderId": "user1",
  "text": "Olá! Como vai?",
  "timeStamp": "2025-10-24T00:39:00.456Z",
  "read": true
}
```

**Resposta de Erro (404):**
```json
{
  "message": "Mensagem com ID msg_inexistente não encontrada",
  "error": "Not Found",
  "statusCode": 404
}
```

**Exemplo de Requisição:**
```bash
curl -X PATCH http://localhost:3000/messages/msg_1761266340456_1/read
```

---

### Atualizar Mensagem

Atualiza informações de uma mensagem existente.

**Endpoint:** `PATCH /messages/:id`

**Path Parameters:**
- `id`: ID da mensagem

**Headers:**
```
Content-Type: application/json
```

**Body (todos os campos são opcionais):**
```json
{
  "text": "Mensagem editada!",
  "read": true
}
```

**Resposta de Sucesso (200):**
```json
{
  "id": "msg_1761266346878_2",
  "conversationId": "conv_1761266249615_1",
  "senderId": "user2",
  "text": "Mensagem editada!",
  "timeStamp": "2025-10-24T00:39:06.878Z",
  "read": true
}
```

**Resposta de Erro (404):**
```json
{
  "message": "Mensagem com ID msg_inexistente não encontrada",
  "error": "Not Found",
  "statusCode": 404
}
```

**Exemplo de Requisição:**
```bash
curl -X PATCH http://localhost:3000/messages/msg_1761266346878_2 \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Mensagem editada!",
    "read": true
  }'
```

---

### Deletar Mensagem

Deleta uma mensagem existente.

**Endpoint:** `DELETE /messages/:id`

**Path Parameters:**
- `id`: ID da mensagem

**Resposta de Sucesso (200):**
```
(Sem conteúdo)
```

**Resposta de Erro (404):**
```json
{
  "message": "Mensagem com ID msg_inexistente não encontrada",
  "error": "Not Found",
  "statusCode": 404
}
```

**Exemplo de Requisição:**
```bash
curl -X DELETE http://localhost:3000/messages/msg_1761266340456_1
```

---

## Estruturas de Dados

### Conversation Entity

```typescript
type conversation = {
  id: string,
  participants: string[],
  lastMessage: {
    text: string,
    senderId: string,
    timestamp: Date
  },
  createdAt: Date,
}
```

### Message Entity

```typescript
type message = {
  id: string,
  conversationId: string,
  senderId: string,
  text: string,
  timeStamp: Date,
  read: boolean,
}
```

---

## Códigos de Status HTTP

- `200 OK` - Requisição bem-sucedida
- `400 Bad Request` - Dados de entrada inválidos (falha na validação Zod)
- `404 Not Found` - Recurso não encontrado

---

## Notas de Implementação

### Validação com Zod

Todas as rotas de criação utilizam validação Zod através do `ZodValidationPipe`. Erros de validação retornam um objeto detalhado com:
- `message`: Descrição geral do erro
- `fieldErrors`: Objeto com erros específicos de cada campo
- `formErrors`: Array com erros gerais do formulário

### Conversão de Datas

As datas são automaticamente convertidas de strings ISO 8601 para objetos Date usando `z.coerce.date()` do Zod. Tanto strings de data quanto objetos Date são aceitos.

### Armazenamento em Memória

**Atenção:** Atualmente, as conversas e mensagens são armazenadas em memória. Os dados serão perdidos quando o servidor for reiniciado. Para produção, considere integrar com Firestore ou outro banco de dados persistente.

### IDs Únicos

Os IDs são gerados no formato:
- Conversas: `conv_{timestamp}_{counter}`
- Mensagens: `msg_{timestamp}_{counter}`

---

## Exemplos de Uso Completo

### Cenário: Criar uma conversa e trocar mensagens

```bash
# 1. Criar uma conversa
CONV_ID=$(curl -X POST http://localhost:3000/conversations \
  -H "Content-Type: application/json" \
  -d '{
    "participantes": ["alice", "bob"],
    "lastMessage": {
      "text": "Oi Bob!",
      "senderId": "alice",
      "timestamp": "2025-10-24T10:00:00.000Z"
    }
  }' | jq -r '.id')

# 2. Enviar primeira mensagem
curl -X POST http://localhost:3000/messages \
  -H "Content-Type: application/json" \
  -d "{
    \"conversationId\": \"$CONV_ID\",
    \"senderId\": \"alice\",
    \"text\": \"Como você está?\"
  }"

# 3. Enviar resposta
MSG_ID=$(curl -X POST http://localhost:3000/messages \
  -H "Content-Type: application/json" \
  -d "{
    \"conversationId\": \"$CONV_ID\",
    \"senderId\": \"bob\",
    \"text\": \"Estou bem, obrigado! E você?\"
  }" | jq -r '.id')

# 4. Marcar mensagem como lida
curl -X PATCH "http://localhost:3000/messages/$MSG_ID/read"

# 5. Listar todas as mensagens da conversa
curl -X GET "http://localhost:3000/messages?conversationId=$CONV_ID"

# 6. Atualizar última mensagem da conversa
curl -X PATCH "http://localhost:3000/conversations/$CONV_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "lastMessage": {
      "text": "Estou bem, obrigado! E você?",
      "senderId": "bob",
      "timestamp": "2025-10-24T10:05:00.000Z"
    }
  }'
```

---

## Suporte

Para dúvidas ou problemas, consulte a documentação principal do projeto ou entre em contato com a equipe de desenvolvimento.


