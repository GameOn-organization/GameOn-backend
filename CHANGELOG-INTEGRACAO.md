# Changelog - Integração Backend-Frontend

## Data: Janeiro 2025

### Alterações Realizadas

#### ✅ Usuários (Users)

**Arquivos Modificados:**
- `src/users/dto/create-user.dto.ts`
- `src/users/entities/user.entity.ts`
- `src/users/users.service.ts`

**Novos Campos Adicionados:**

1. **`images`** (array de strings)
   - Tipo: `z.array(z.string().nullable()).default([]).optional()`
   - Descrição: Array de URLs de imagens do perfil (compatível com frontend)
   - Compatibilidade: Mantido campo `image` (singular) para compatibilidade retroativa

2. **`descricao`** (string)
   - Tipo: `z.string().max(500).optional()`
   - Descrição: Descrição/biografia do perfil
   - Máximo: 500 caracteres

3. **`sexo`** (enum)
   - Tipo: `z.enum(['m', 'f', 'nb']).optional()`
   - Descrição: Gênero/sexo do usuário
   - Valores: 'm' (masculino), 'f' (feminino), 'nb' (não-binário)

4. **`localizacao`** (string)
   - Tipo: `z.string().max(200).optional()`
   - Descrição: Localização do usuário
   - Máximo: 200 caracteres

5. **`wallpaper`** (string | null)
   - Tipo: `z.string().nullable().optional()`
   - Descrição: URL do wallpaper do perfil

**Mudanças no Service:**

- Método `create()`: Agora processa `images[]` e mantém compatibilidade com `image`
- Método `findAll()`: Retorna todos os novos campos
- Método `findOne()`: Retorna todos os novos campos
- Método `update()`: Atualiza `image` automaticamente quando `images[]` é fornecido
- Método `findByTag()`: Retorna todos os novos campos

**Compatibilidade Retroativa:**

- ✅ Campo `image` mantido (singular) para compatibilidade com código antigo
- ✅ Se `images[]` não for fornecido, usa `image` (se disponível)
- ✅ Se `images[]` for fornecido, `image` é automaticamente definido como primeiro elemento
- ✅ Todos os novos campos são opcionais

**Exemplo de JSON de Resposta:**

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

### Validações Implementadas

- `descricao`: máximo 500 caracteres
- `sexo`: apenas valores 'm', 'f', 'nb'
- `localizacao`: máximo 200 caracteres
- `images`: array de strings (URLs) ou null
- `wallpaper`: string (URL) ou null

### Próximos Passos Recomendados

1. ✅ Backend atualizado para aceitar novos campos
2. ⏳ Frontend deve enviar dados no formato correto:
   - `nome` → `name`
   - `idade` (calculado) → `age` (number)
   - `descricao` → `descricao`
   - `sexo` → `sexo` ('m', 'f', 'nb')
   - `localizacao` → `localizacao`
   - `images[]` → `images[]`
   - `wallpaper` → `wallpaper`
   - `selected1[]` + `selected2[]` → `tags[]` (combinar)

3. ⏳ Testar integração completa
4. ⏳ Atualizar documentação da API se necessário

### Notas Técnicas

- O tipo `image` foi alterado de `any` para `string | null` para melhor tipagem
- Todos os métodos do service foram atualizados para retornar os novos campos
- Compatibilidade retroativa mantida através do campo `image` (singular)

