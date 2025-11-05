#!/bin/bash

# Script rápido para limpar usuários órfãos via API

API_URL="https://api-m2z4unnk3a-uc.a.run.app"

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  LIMPEZA DE USUÁRIOS ÓRFÃOS                                   ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"

# Verificar se foi passado email e senha
if [ $# -eq 0 ]; then
  echo -e "\n${YELLOW}Uso: $0 <email> <senha>${NC}"
  echo -e "Exemplo: $0 seu@email.com senha123\n"
  exit 1
fi

EMAIL=$1
PASSWORD=$2

echo -e "\n${YELLOW}📝 Fazendo login...${NC}"

# Fazer login
LOGIN_RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL\", \"password\": \"$PASSWORD\"}" \
  "$API_URL/auth/login")

# Verificar se login foi bem-sucedido
if ! echo "$LOGIN_RESPONSE" | jq -e '.customToken' > /dev/null 2>&1; then
  echo -e "${RED}❌ Erro no login:${NC}"
  echo "$LOGIN_RESPONSE" | jq '.'
  exit 1
fi

TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.customToken')
echo -e "${GREEN}✅ Login bem-sucedido!${NC}"

echo -e "\n${YELLOW}🧹 Executando limpeza de usuários órfãos...${NC}\n"

# Executar limpeza
CLEANUP_RESPONSE=$(curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" \
  "$API_URL/users/cleanup-orphans")

# Verificar resultado
ORPHANS_FOUND=$(echo "$CLEANUP_RESPONSE" | jq -r '.orphansFound')
DELETED=$(echo "$CLEANUP_RESPONSE" | jq -r '.deleted')
ERRORS=$(echo "$CLEANUP_RESPONSE" | jq -r '.errors')

if [ "$ORPHANS_FOUND" -eq "0" ]; then
  echo -e "${GREEN}✅ Nenhum usuário órfão encontrado! Tudo está sincronizado.${NC}\n"
else
  echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║  RESUMO DA LIMPEZA                                            ║${NC}"
  echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}\n"
  echo -e "${BLUE}📊 Usuários órfãos encontrados: ${ORPHANS_FOUND}${NC}"
  echo -e "${GREEN}✅ Usuários deletados: ${DELETED}${NC}"
  
  if [ "$ERRORS" -gt "0" ]; then
    echo -e "${RED}❌ Erros: ${ERRORS}${NC}"
  fi
  
  echo -e "\n${YELLOW}📋 Lista de usuários deletados:${NC}\n"
  echo "$CLEANUP_RESPONSE" | jq -r '.orphanUsers[] | "  - \(.email) (\(.uid))"'
  
  echo -e "\n${GREEN}🎉 Limpeza concluída com sucesso!${NC}\n"
fi

