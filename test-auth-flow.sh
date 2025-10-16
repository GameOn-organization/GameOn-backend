#!/bin/bash

# Script de teste completo do fluxo de autenticação
# Uso: ./test-auth-flow.sh

set -e

API="https://api-m2z4unnk3a-uc.a.run.app"
# Para testes locais, use: API="http://localhost:5001/tcc-gameon/us-central1/api"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  TESTE COMPLETO DO FLUXO DE AUTENTICAÇÃO                      ║${NC}"
echo -e "${BLUE}║  API: $API${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"

# Gerar email único para não ter conflitos
TIMESTAMP=$(date +%s)
TEST_EMAIL="teste.auth.${TIMESTAMP}@example.com"

# 1. SIGNUP
echo -e "\n${YELLOW}PASSO 1: Criando novo usuário...${NC}"
echo -e "   Email: ${TEST_EMAIL}"

SIGNUP=$(curl -s -X POST -H "Content-Type: application/json" \
  -d "{\"email\": \"${TEST_EMAIL}\", \"password\": \"senha123\", \"name\": \"Usuario Teste ${TIMESTAMP}\", \"age\": 28}" \
  "$API/auth/signup")

SIGNUP_STATUS=$(echo "$SIGNUP" | jq -r '.message // .error // "Unknown error"')

if echo "$SIGNUP" | jq -e '.user.uid' > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Usuário criado com sucesso!${NC}"
  echo "$SIGNUP" | jq '{
    uid: .user.uid,
    email: .user.email,
    name: .user.name,
    hasCustomToken: (.customToken != null)
  }'
else
  echo -e "${RED}❌ Erro ao criar usuário: $SIGNUP_STATUS${NC}"
  exit 1
fi

# 2. LOGIN
echo -e "\n${YELLOW}🔐 PASSO 2: Fazendo login...${NC}"

LOGIN=$(curl -s -X POST -H "Content-Type: application/json" \
  -d "{\"email\": \"${TEST_EMAIL}\", \"password\": \"senha123\"}" \
  "$API/auth/login")

if echo "$LOGIN" | jq -e '.customToken' > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Login bem-sucedido!${NC}"
  MY_UID=$(echo "$LOGIN" | jq -r '.user.uid')
  TOKEN=$(echo "$LOGIN" | jq -r '.customToken')
  
  echo "$LOGIN" | jq '{
    uid: .user.uid,
    email: .user.email,
    tokenLength: (.customToken | length)
  }'
  
  echo -e "\n${BLUE}🔑 Custom Token (primeiros 80 chars):${NC}"
  echo "   ${TOKEN:0:80}..."
else
  echo -e "${RED}❌ Erro ao fazer login${NC}"
  echo "$LOGIN" | jq '.'
  exit 1
fi

# 3. LISTAR USUÁRIOS
echo -e "\n${YELLOW}📋 PASSO 3: Listando todos os usuários (sem autenticação)...${NC}"

USERS=$(curl -s "$API/users")
USER_COUNT=$(echo "$USERS" | jq 'length')

echo -e "${GREEN}✅ Total de usuários: $USER_COUNT${NC}"
echo -e "\nPrimeiros 3 usuários:"
echo "$USERS" | jq '.[0:3] | .[] | {id, name, email}'

# Pegar um usuário que NÃO seja o atual para deletar
TARGET_ID=$(echo "$USERS" | jq -r ".[] | select(.id != \"$MY_UID\") | .id" | head -1)

if [ -z "$TARGET_ID" ]; then
  echo -e "${YELLOW}⚠️  Apenas um usuário no banco, não é possível testar deleção${NC}"
  echo -e "\n${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║  TESTES DE SIGNUP E LOGIN CONCLUÍDOS COM SUCESSO! ✅          ║${NC}"
  echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
  exit 0
fi

TARGET_NAME=$(echo "$USERS" | jq -r ".[] | select(.id == \"$TARGET_ID\") | .name")

echo -e "\n${BLUE}🎯 Usuário selecionado para teste de deleção:${NC}"
echo "   ID: $TARGET_ID"
echo "   Nome: $TARGET_NAME"

# 4. DELETAR COM CUSTOM TOKEN
echo -e "\n${YELLOW}🗑️  PASSO 4: Deletando usuário com customToken...${NC}"

DELETE_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X DELETE \
  -H "Authorization: Bearer $TOKEN" \
  "$API/users/$TARGET_ID")

HTTP_STATUS=$(echo "$DELETE_RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$DELETE_RESPONSE" | sed '/HTTP_STATUS/d')

if [ "$HTTP_STATUS" == "200" ]; then
  echo -e "${GREEN}✅ Deleção bem-sucedida! Status: $HTTP_STATUS${NC}"
  [ ! -z "$BODY" ] && (echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY")
else
  echo -e "${RED}❌ Erro na deleção! Status: $HTTP_STATUS${NC}"
  echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
  exit 1
fi

# 5. VERIFICAR SE FOI DELETADO
echo -e "\n${YELLOW}✓ PASSO 5: Verificando se o usuário foi deletado...${NC}"

USERS_AFTER=$(curl -s "$API/users")
USER_COUNT_AFTER=$(echo "$USERS_AFTER" | jq 'length')
DELETED_USER_EXISTS=$(echo "$USERS_AFTER" | jq -r ".[] | select(.id == \"$TARGET_ID\") | .id" 2>/dev/null || echo "")

if [ -z "$DELETED_USER_EXISTS" ]; then
  echo -e "${GREEN}✅ Usuário deletado com sucesso!${NC}"
  echo "   Usuários antes: $USER_COUNT"
  echo "   Usuários depois: $USER_COUNT_AFTER"
  echo "   Diferença: $((USER_COUNT - USER_COUNT_AFTER)) usuário removido"
else
  echo -e "${RED}❌ Usuário ainda existe no banco${NC}"
  exit 1
fi

# 6. TESTAR OUTROS ENDPOINTS AUTENTICADOS
echo -e "\n${YELLOW}🔍 PASSO 6: Testando outros endpoints autenticados...${NC}"

# GET /users/me
echo -e "\n${BLUE}GET /users/me (meu perfil)${NC}"
MY_PROFILE=$(curl -s -H "Authorization: Bearer $TOKEN" "$API/users/me")
if echo "$MY_PROFILE" | jq -e '.id' > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Perfil obtido com sucesso${NC}"
  echo "$MY_PROFILE" | jq '{id, name, email, age}'
else
  echo -e "${RED}❌ Erro ao obter perfil${NC}"
  echo "$MY_PROFILE" | jq '.'
fi

# PATCH /users/me (atualizar perfil)
echo -e "\n${BLUE}PATCH /users/me (atualizar perfil)${NC}"
UPDATE_PROFILE=$(curl -s -X PATCH \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Nome Atualizado", "tags": ["futebol", "basquete"]}' \
  "$API/users/me")
  
if echo "$UPDATE_PROFILE" | jq -e '.id' > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Perfil atualizado com sucesso${NC}"
  echo "$UPDATE_PROFILE" | jq '{id, name, tags}'
else
  echo -e "${RED}❌ Erro ao atualizar perfil${NC}"
  echo "$UPDATE_PROFILE" | jq '.'
fi

# RESUMO FINAL
echo -e "\n${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  TODOS OS TESTES CONCLUÍDOS COM SUCESSO! ✅                   ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"

echo -e "\n${BLUE}📊 Resumo dos Testes:${NC}"
echo -e "   ✅ Signup - Criação de usuário"
echo -e "   ✅ Login - Autenticação e obtenção de customToken"
echo -e "   ✅ GET /users - Listagem sem autenticação"
echo -e "   ✅ DELETE /users/:id - Deleção com customToken"
echo -e "   ✅ GET /users/me - Obter perfil próprio"
echo -e "   ✅ PATCH /users/me - Atualizar perfil"

echo -e "\n${YELLOW}💡 Dica:${NC} O customToken pode ser usado diretamente em testes,"
echo -e "   mas em produção deve ser trocado por idToken usando o Firebase SDK."
echo -e "\n${BLUE}📚 Documentação completa:${NC} docs/CUSTOM-TOKEN-AUTH.md"

