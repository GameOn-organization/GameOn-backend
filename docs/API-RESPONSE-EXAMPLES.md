# Exemplos de Resposta da API - Compatível com Frontend

Este documento mostra exemplos de JSON retornados pela API após as alterações para compatibilidade com o frontend.

## 👤 Usuário (User/Profile)

### POST /users - Criar Usuário

**Request Body:**
```json
{
  "name": "João Silva",
  "age": 25,
  "email": "joao@example.com",
  "phone": "(11) 98765-4321",
  "descricao": "Apaixonado por esportes e jogos",
  "sexo": "m",
  "localizacao": "São Paulo - SP - Brasil",
  "images": [
    "https://example.com/image1.jpg",
    "https://example.com/image2.jpg",
    "https://example.com/image3.jpg"
  ],
  "wallpaper": "https://example.com/wallpaper.jpg",
  "tags": ["futebol", "basquete", "league-of-legends"]
}
```

**Response (200 OK):**
```json
{
  "id": "firebase-uid-123",
  "name": "João Silva",
  "age": 25,
  "email": "joao@example.com",
  "phone": "(11) 98765-4321",
  "image": "https://example.com/image1.jpg",
  "images": [
    "https://example.com/image1.jpg",
    "https://example.com/image2.jpg",
    "https://example.com/image3.jpg"
  ],
  "descricao": "Apaixonado por esportes e jogos",
  "sexo": "m",
  "localizacao": "São Paulo - SP - Brasil",
  "wallpaper": "https://example.com/wallpaper.jpg",
  "tags": ["futebol", "basquete", "league-of-legends"]
}
```

### GET /users - Listar Usuários

**Response (200 OK):**
```json
[
  {
    "id": "firebase-uid-123",
    "name": "João Silva",
    "age": 25,
    "email": "joao@example.com",
    "phone": "(11) 98765-4321",
    "image": "https://example.com/image1.jpg",
    "images": [
      "https://example.com/image1.jpg",
      "https://example.com/image2.jpg"
    ],
    "descricao": "Apaixonado por esportes e jogos",
    "sexo": "m",
    "localizacao": "São Paulo - SP - Brasil",
    "wallpaper": "https://example.com/wallpaper.jpg",
    "tags": ["futebol", "basquete", "league-of-legends"]
  },
  {
    "id": "firebase-uid-456",
    "name": "Maria Santos",
    "age": 28,
    "email": "maria@example.com",
    "phone": "(21) 91234-5678",
    "image": "https://example.com/maria.jpg",
    "images": [
      "https://example.com/maria.jpg"
    ],
    "descricao": "Gamer e atleta",
    "sexo": "f",
    "localizacao": "Rio de Janeiro - RJ - Brasil",
    "wallpaper": null,
    "tags": ["vôlei", "counter-strike"]
  }
]
```

### GET /users/:id - Buscar Usuário Específico

**Response (200 OK):**
```json
{
  "id": "firebase-uid-123",
  "name": "João Silva",
  "age": 25,
  "email": "joao@example.com",
  "phone": "(11) 98765-4321",
  "image": "https://example.com/image1.jpg",
  "images": [
    "https://example.com/image1.jpg",
    "https://example.com/image2.jpg",
    "https://example.com/image3.jpg"
  ],
  "descricao": "Apaixonado por esportes e jogos",
  "sexo": "m",
  "localizacao": "São Paulo - SP - Brasil",
  "wallpaper": "https://example.com/wallpaper.jpg",
  "tags": ["futebol", "basquete", "league-of-legends"]
}
```

### GET /users/me - Meu Perfil

**Response (200 OK):**
```json
{
  "id": "firebase-uid-123",
  "name": "João Silva",
  "age": 25,
  "email": "joao@example.com",
  "phone": "(11) 98765-4321",
  "image": "https://example.com/image1.jpg",
  "images": [
    "https://example.com/image1.jpg",
    "https://example.com/image2.jpg"
  ],
  "descricao": "Apaixonado por esportes e jogos",
  "sexo": "m",
  "localizacao": "São Paulo - SP - Brasil",
  "wallpaper": "https://example.com/wallpaper.jpg",
  "tags": ["futebol", "basquete", "league-of-legends"]
}
```

### PATCH /users/me - Atualizar Meu Perfil

**Request Body (campos opcionais):**
```json
{
  "descricao": "Nova descrição atualizada",
  "images": [
    "https://example.com/new-image1.jpg",
    "https://example.com/new-image2.jpg"
  ],
  "wallpaper": "https://example.com/new-wallpaper.jpg"
}
```

**Response (200 OK):**
```json
{
  "id": "firebase-uid-123",
  "name": "João Silva",
  "age": 25,
  "email": "joao@example.com",
  "phone": "(11) 98765-4321",
  "image": "https://example.com/new-image1.jpg",
  "images": [
    "https://example.com/new-image1.jpg",
    "https://example.com/new-image2.jpg"
  ],
  "descricao": "Nova descrição atualizada",
  "sexo": "m",
  "localizacao": "São Paulo - SP - Brasil",
  "wallpaper": "https://example.com/new-wallpaper.jpg",
  "tags": ["futebol", "basquete", "league-of-legends"]
}
```

## 📝 Campos Disponíveis

### Campos Obrigatórios
- `id`: string (Firebase UID)
- `name`: string
- `age`: number
- `email`: string
- `tags`: string[] (array de tags/interesses)

### Campos Opcionais
- `phone`: string (formato: (XX) XXXXX-XXXX)
- `image`: string | null (imagem principal - mantido para compatibilidade)
- `images`: (string | null)[] (array de imagens - preferido)
- `descricao`: string (máximo 500 caracteres)
- `sexo`: 'm' | 'f' | 'nb' (masculino, feminino, não-binário)
- `localizacao`: string (máximo 200 caracteres)
- `wallpaper`: string | null (URL do wallpaper do perfil)

## 🔄 Compatibilidade Retroativa

O backend mantém compatibilidade com versões antigas:

1. **Campo `image`**: Se `images[]` não for fornecido, o backend usa `image`. Se `images[]` for fornecido, `image` é automaticamente definido como o primeiro elemento do array.

2. **Campos novos**: Todos os novos campos (`descricao`, `sexo`, `localizacao`, `wallpaper`, `images`) são opcionais, então requisições antigas continuam funcionando.

3. **Respostas**: Sempre retornam tanto `image` quanto `images[]` para máxima compatibilidade.

## 📋 Mapeamento Frontend → Backend

| Campo Frontend | Campo Backend | Tipo | Observações |
|----------------|---------------|------|-------------|
| `nome` | `name` | string | Obrigatório |
| `idade` (calculado) | `age` | number | Calculado a partir de data de nascimento |
| `descricao` | `descricao` | string | Opcional, máximo 500 caracteres |
| `sexo` | `sexo` | 'm'\|'f'\|'nb' | Opcional |
| `localizacao` | `localizacao` | string | Opcional, máximo 200 caracteres |
| `images[]` | `images` | (string\|null)[] | Opcional, array de URLs |
| `wallpaper` | `wallpaper` | string\|null | Opcional |
| `selected1[]` + `selected2[]` | `tags` | string[] | Combinar arrays |

## ✅ Validações

- `name`: obrigatório, mínimo 1 caractere
- `age`: opcional, inteiro não-negativo
- `email`: obrigatório, formato de email válido
- `phone`: opcional, formato `(XX) XXXXX-XXXX`, DDD válido
- `descricao`: opcional, máximo 500 caracteres
- `sexo`: opcional, valores: 'm', 'f', 'nb'
- `localizacao`: opcional, máximo 200 caracteres
- `images`: opcional, array de strings (URLs) ou null
- `wallpaper`: opcional, string (URL) ou null
- `tags`: opcional, array de strings, cada tag com mínimo 1 caractere

