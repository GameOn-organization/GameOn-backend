# Documentação de Ferramentas e Dependências - GameOn Backend

Esta documentação descreve todas as ferramentas, bibliotecas e dependências utilizadas no projeto GameOn Backend (NestJS).

---

## 📋 Índice

1. [Framework e Core](#framework-e-core)
2. [Firebase](#firebase)
3. [Validação e Schemas](#validação-e-schemas)
4. [Utilitários](#utilitários)
5. [Ferramentas de Desenvolvimento](#ferramentas-de-desenvolvimento)
6. [CI/CD](#cicd)
7. [Build e Deploy](#build-e-deploy)

---

## 🚀 Framework e Core

### NestJS

#### @nestjs/core (^11.0.1)
**Descrição:** Framework Node.js progressivo para construção de aplicações server-side eficientes e escaláveis.

**Funcionalidades:**
- Arquitetura modular
- Injeção de dependências
- Decorators TypeScript
- Suporte a microserviços
- WebSockets
- GraphQL

**Uso no projeto:**
- Framework principal do backend
- Estrutura modular (modules, controllers, services)
- Arquivo principal: `src/main.ts`

**Documentação:** https://docs.nestjs.com/

---

#### @nestjs/common (^11.0.1)
**Descrição:** Biblioteca comum do NestJS com decorators, guards, interceptors, pipes, etc.

**Funcionalidades:**
- Decorators (@Controller, @Injectable, @Get, @Post, etc.)
- Guards para autenticação/autorização
- Interceptors para transformação de dados
- Pipes para validação e transformação
- Exception filters
- Middleware

**Uso no projeto:**
- Decorators em controllers e services
- Guards de autenticação (`auth.guard.ts`)
- Pipes de validação (`zod-validation.pipe.ts`)
- Exception handling

**Documentação:** https://docs.nestjs.com/

---

#### @nestjs/platform-express (^11.0.1)
**Descrição:** Adaptador Express para NestJS.

**Funcionalidades:**
- Integração com Express.js
- Middleware do Express
- Routing do Express

**Uso no projeto:**
- Plataforma HTTP padrão
- Middleware customizado em `main.ts`
- CORS configurado

**Documentação:** https://docs.nestjs.com/techniques/performance

---

#### @nestjs/cli (^11.0.0)
**Descrição:** CLI do NestJS para gerenciamento de projetos.

**Funcionalidades:**
- Geração de módulos, controllers, services
- Build e start do projeto
- Scaffolding de código

**Uso no projeto:**
- Comandos: `nest build`, `nest start`
- Geração de código durante desenvolvimento

**Documentação:** https://docs.nestjs.com/cli/overview

---

#### @nestjs/schematics (^11.0.0)
**Descrição:** Schematics para geração de código no NestJS.

**Uso no projeto:**
- Templates para criação de arquivos
- Padrões de código consistentes

**Documentação:** https://docs.nestjs.com/cli/usages#nest-generate

---

### Express (@types/express ^5.0.0)
**Descrição:** Framework web rápido e minimalista para Node.js.

**Uso no projeto:**
- Base do `@nestjs/platform-express`
- Tipos TypeScript para Express

**Documentação:** https://expressjs.com/

---

## 🔥 Firebase

### Firebase Admin SDK (^12.6.0)
**Descrição:** SDK administrativo do Firebase para Node.js (server-side).

**Módulos utilizados no projeto:**

#### Firebase Admin (`firebase-admin`)
**Descrição:** SDK completo para acesso administrativo aos serviços Firebase.

**Funcionalidades:**
- Autenticação administrativa
- Firestore (banco de dados)
- Firebase Storage
- Cloud Messaging
- Custom tokens
- Gerenciamento de usuários

**Uso no projeto:**
- Arquivo: `src/firebase/firebase.providers.ts`
- Inicialização com múltiplas estratégias de credenciais:
  1. Variáveis de ambiente (`FB_PROJECT_ID`, `FB_CLIENT_EMAIL`, `FB_PRIVATE_KEY`)
  2. Arquivo JSON de credenciais
  3. Application Default Credentials (fallback)
- Provider para Firestore injetado em módulos

**Configuração:**
```typescript
// Estratégias de inicialização:
// 1. Credenciais explícitas (env vars)
// 2. Arquivo JSON (tcc-gameon-firebase-adminsdk-*.json)
// 3. Application Default Credentials
```

**Documentação:** https://firebase.google.com/docs/admin/setup

---

#### Firestore (via Firebase Admin)
**Descrição:** Banco de dados NoSQL em tempo real.

**Funcionalidades:**
- Operações CRUD
- Queries complexas
- Transações
- Batch operations
- Listeners em tempo real

**Uso no projeto:**
- Provider `FIRESTORE` injetado em services
- Operações de banco de dados em:
  - `users.service.ts` - Gerenciamento de usuários/perfis
  - `auth.service.ts` - Autenticação e perfis
  - `conversations.service.ts` - Conversas
  - `messages.service.ts` - Mensagens
  - `posts.service.ts` - Posts

**Exemplo de uso:**
```typescript
constructor(@Inject(FIRESTORE) private readonly db: any) {}

async findAll() {
  const snapshot = await this.db.collection('profiles').get();
  return snapshot.docs.map(doc => doc.data());
}
```

**Documentação:** https://firebase.google.com/docs/firestore

---

#### Firebase Authentication (via Firebase Admin)
**Descrição:** Autenticação de usuários no servidor.

**Funcionalidades:**
- Criação de custom tokens
- Verificação de tokens ID
- Gerenciamento de usuários
- Criação/exclusão de usuários

**Uso no projeto:**
- Arquivo: `src/auth/auth.service.ts`
- Criação de custom tokens para autenticação
- Verificação de tokens recebidos do cliente
- Criação de perfis de usuário

**Exemplo de uso:**
```typescript
import * as admin from 'firebase-admin';

// Criar custom token
const customToken = await admin.auth().createCustomToken(uid);

// Verificar token ID
const decodedToken = await admin.auth().verifyIdToken(idToken);
```

**Documentação:** https://firebase.google.com/docs/auth/admin

---

#### Firebase Storage (via Firebase Admin)
**Descrição:** Armazenamento de arquivos na nuvem.

**Funcionalidades:**
- Upload/download de arquivos
- Gerenciamento de buckets
- URLs assinadas
- Regras de segurança

**Uso no projeto:**
- Configurado no `firebase.providers.ts` (storageBucket)
- Disponível através do Admin SDK
- Usado para gerenciar uploads de imagens

**Documentação:** https://firebase.google.com/docs/storage/admin

---

### Firebase Functions (^6.0.1)
**Descrição:** Framework para funções serverless do Firebase.

**Funcionalidades:**
- Funções HTTP
- Triggers de eventos
- Cloud Functions
- Deploy para Firebase

**Uso no projeto:**
- Arquivo: `index.ts` (ponto de entrada)
- Deploy como Cloud Function
- Scripts: `deploy`, `serve`, `shell`, `logs`

**Scripts relacionados:**
```json
"deploy": "firebase deploy --only functions"
"serve": "npm run build && firebase emulators:start --only functions"
"shell": "npm run build && firebase functions:shell"
"logs": "firebase functions:log"
```

**Documentação:** https://firebase.google.com/docs/functions

---

### Firebase Functions Test (^3.1.0)
**Descrição:** Utilitários de teste para Firebase Functions.

**Uso no projeto:**
- Testes de funções Firebase
- Mocks e stubs para Firebase
- Ambiente de teste

**Documentação:** https://firebase.google.com/docs/functions/unit-testing

---

### Firebase Emulators
**Descrição:** Emuladores locais do Firebase para desenvolvimento.

**Funcionalidades:**
- Emulador de Firestore (porta 8081)
- Emulador de Auth (porta 9098)
- Emulador de Functions (porta 5001)
- UI de emuladores (porta 4001)

**Uso no projeto:**
- Arquivo: `firebase.json` - Configuração dos emuladores
- Script: `dev` - Inicia emuladores com variáveis de ambiente
- Desenvolvimento local sem custos

**Configuração (`firebase.json`):**
```json
{
  "emulators": {
    "auth": { "port": 9098 },
    "firestore": { "port": 8081 },
    "functions": { "port": 5001 },
    "ui": { "port": 4001 }
  }
}
```

**Script de desenvolvimento:**
```bash
npm run dev
# Inicia emuladores com:
# - FIRESTORE_EMULATOR_HOST=127.0.0.1:8081
# - FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9098
# - GCLOUD_PROJECT=tcc-gameon
```

**Documentação:** https://firebase.google.com/docs/emulator-suite

---

## ✅ Validação e Schemas

### Zod (^4.1.9)
**Descrição:** Biblioteca de validação de esquemas TypeScript-first com inferência de tipos.

**Funcionalidades:**
- Validação de dados em runtime
- Inferência automática de tipos TypeScript
- Schemas declarativos
- Mensagens de erro customizáveis
- Validação de objetos, arrays, strings, números, etc.

**Uso no projeto:**
- Arquivo: `src/common/zod-validation.pipe.ts`
- Pipe customizado para validação em controllers
- Validação de DTOs (Data Transfer Objects)
- Validação de entrada de dados em endpoints

**Implementação:**
```typescript
// zod-validation.pipe.ts
@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodSchema) {}
  
  transform(value: unknown) {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException({
        message: 'Validation failed',
        fieldErrors: result.error.flatten().fieldErrors,
        formErrors: result.error.flatten().formErrors,
      });
    }
    return result.data;
  }
}
```

**Uso em controllers:**
```typescript
@Post()
@UsePipes(new ZodValidationPipe(createUserSchema))
async create(@Body() createUserDto: CreateUserDto) {
  // Dados já validados pelo Zod
}
```

**Vantagens:**
- Type-safe: tipos inferidos automaticamente
- Runtime validation: validação em tempo de execução
- Mensagens de erro detalhadas
- Reutilizável: schemas podem ser compartilhados

**Documentação:** https://zod.dev/

---

## 🛠️ Utilitários

### Dotenv (^17.2.1)
**Descrição:** Carregamento de variáveis de ambiente a partir de arquivo `.env`.

**Funcionalidades:**
- Carrega variáveis de ambiente de arquivo `.env`
- Suporte a diferentes ambientes
- Não sobrescreve variáveis já definidas

**Uso no projeto:**
- Configuração de credenciais Firebase
- Variáveis de ambiente para desenvolvimento/produção
- Configurações sensíveis (chaves, tokens)

**Variáveis de ambiente usadas:**
- `FB_PROJECT_ID` - ID do projeto Firebase
- `FB_CLIENT_EMAIL` - Email da conta de serviço
- `FB_PRIVATE_KEY` - Chave privada da conta de serviço
- `FB_STORAGE_BUCKET` - Bucket do Firebase Storage
- `PORT` - Porta do servidor (padrão: 3000)
- `NODE_ENV` - Ambiente (dev, production)
- `FIRESTORE_EMULATOR_HOST` - Host do emulador Firestore
- `FIREBASE_AUTH_EMULATOR_HOST` - Host do emulador Auth

**Documentação:** https://github.com/motdotla/dotenv

---

### Source Map Support (^0.5.21)
**Descrição:** Suporte a source maps para stack traces melhores.

**Uso no projeto:**
- Melhora debugging em produção
- Stack traces apontam para código fonte original
- Útil para TypeScript compilado

**Documentação:** https://github.com/evanw/node-source-map-support

---

## 🔧 Ferramentas de Desenvolvimento

### TypeScript
**Descrição:** Superset tipado do JavaScript com compilação estática.

**Pacotes relacionados:**
- **TypeScript (^5.7.3)** - Compilador principal
- **@types/node (^22.10.7)** - Tipos para Node.js
- **@types/express (^5.0.0)** - Tipos para Express
- **ts-node (^10.9.2)** - Execução direta de TypeScript no Node.js
- **tsconfig-paths (^4.2.0)** - Resolução de paths do TypeScript em runtime
- **ts-loader (^9.5.2)** - Loader do Webpack para TypeScript

**Funcionalidades:**
- Tipagem estática
- Decorators
- Interfaces e tipos
- Compilação para JavaScript
- Inferência de tipos
- Type checking em tempo de desenvolvimento

**Uso no projeto:**
- Linguagem principal do projeto
- Arquivos `.ts` em `src/`
- Configuração: `tsconfig.json`, `tsconfig.build.json`
- Tipos para todas as dependências
- Execução direta com `ts-node` para scripts
- Paths aliases configurados

**Configuração:**
- `tsconfig.json` - Configuração base do TypeScript
- `tsconfig.build.json` - Configuração específica para build
- Target: ES2020 ou superior
- Module: CommonJS ou ESNext
- Decorators habilitados para NestJS

**Documentação:** https://www.typescriptlang.org/

---

### ESLint (^9.18.0)
**Descrição:** Linter para JavaScript e TypeScript.

**Funcionalidades:**
- Análise estática de código
- Detecção de erros e problemas
- Padrões de código
- Auto-fix

**Uso no projeto:**
- Configuração: `eslint.config.mjs`
- Integração com Prettier
- Regras do Google Style Guide
- Plugin TypeScript

**Plugins e configurações:**
- `@typescript-eslint/eslint-plugin` - Regras TypeScript
- `@typescript-eslint/parser` - Parser TypeScript
- `eslint-config-google` - Estilo Google
- `eslint-config-prettier` - Integração Prettier
- `eslint-plugin-prettier` - Prettier como regra ESLint
- `eslint-plugin-import` - Regras de importação

**Script:**
```bash
npm run lint
# Executa ESLint e corrige automaticamente
```

**Documentação:** https://eslint.org/

---

### Prettier (^3.4.2)
**Descrição:** Formatador de código opinativo.

**Funcionalidades:**
- Formatação automática de código
- Consistência de estilo
- Suporte a múltiplas linguagens

**Uso no projeto:**
- Integrado com ESLint
- Formatação automática em save (IDE)
- Script: `npm run format`

**Script:**
```bash
npm run format
# Formata todos os arquivos TypeScript
```

**Documentação:** https://prettier.io/

---

## 🚀 CI/CD

### GitHub Actions
**Descrição:** Plataforma de automação de CI/CD integrada ao GitHub.

**Funcionalidades:**
- Execução de workflows automatizados
- Testes e builds em pull requests e merges
- Deploy automático após build bem-sucedido
- Integração com Firebase Functions

**Uso no projeto:**
- Esteira de CI/CD configurada para o backend
- Workflow executado em eventos de push/merge
- Processo automatizado:
  1. **Teste de Build:** Executa `npm run build` para verificar se o código compila corretamente
  2. **Validação:** Verifica se não há erros de compilação TypeScript
  3. **Deploy:** Se o build for bem-sucedido, faz deploy automático no Firebase Functions

**Fluxo de CI/CD:**
```
Push/Merge → GitHub Actions Trigger
    ↓
Instalar dependências (npm install)
    ↓
Executar build (npm run build)
    ↓
Build bem-sucedido? → Sim → Deploy no Firebase Functions
    ↓
                    Não → Falha do workflow
```

**Benefícios:**
- **Validação automática:** Detecta erros de compilação antes de chegar à produção
- **Deploy automatizado:** Reduz erros manuais e acelera o processo
- **Histórico:** Mantém registro de todos os builds e deploys
- **Rollback:** Facilita reverter para versões anteriores em caso de problemas

**Configuração típica:**
```yaml
# .github/workflows/deploy.yml
name: Build and Deploy

on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '22'
      - run: npm install
      - run: npm run build
      - name: Deploy to Firebase
        if: success()
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
          projectId: tcc-gameon
```

**Documentação:** https://docs.github.com/en/actions

---

## 🏗️ Build e Deploy

### NestJS Build
**Descrição:** Sistema de build do NestJS.

**Funcionalidades:**
- Compilação TypeScript
- Otimizações
- Geração de arquivos JavaScript

**Scripts:**
```bash
npm run build        # Build de produção
npm run build:watch  # Build em modo watch
```

**Saída:**
- Arquivos compilados em `dist/`
- Source maps para debugging
- Tipos TypeScript (`.d.ts`)

---

### Firebase Deploy
**Descrição:** Deploy para Firebase Cloud Functions.

**Funcionalidades:**
- Deploy de funções serverless
- Gerenciamento de versões
- Rollback

**Scripts:**
```bash
npm run deploy  # Deploy para produção
npm run serve   # Teste local antes do deploy
npm run logs    # Visualizar logs
npm run shell   # Shell interativo
```

**Processo:**
1. `npm run build` - Compila TypeScript
2. `firebase deploy --only functions` - Faz deploy

**Documentação:** https://firebase.google.com/docs/functions/deploy

---

## 📦 Scripts Disponíveis

```json
{
  "build": "nest build",                    // Compila o projeto
  "format": "prettier --write ...",         // Formata código
  "start": "nest start",                    // Inicia servidor
  "start:dev": "nest start --watch",       // Modo desenvolvimento (watch)
  "start:debug": "nest start --debug",     // Modo debug
  "start:prod": "node dist/main",          // Produção
  "lint": "eslint ... --fix",              // Lint e corrige
  "build:watch": "tsc --watch",            // Build em watch
  "dev": "firebase emulators:start",       // Emuladores Firebase
  "serve": "npm run build && firebase emulators:start --only functions",
  "shell": "npm run build && firebase functions:shell",
  "deploy": "firebase deploy --only functions",  // Deploy
  "logs": "firebase functions:log"         // Logs
}
```

---

## 🔗 Links Úteis

- **Documentação NestJS:** https://docs.nestjs.com/
- **Documentação Firebase Admin:** https://firebase.google.com/docs/admin/setup
- **Documentação Zod:** https://zod.dev/
- **Documentação TypeScript:** https://www.typescriptlang.org/
- **Documentação Firebase Functions:** https://firebase.google.com/docs/functions
- **Documentação Firebase Emulators:** https://firebase.google.com/docs/emulator-suite
- **Documentação GitHub Actions:** https://docs.github.com/en/actions

---

## 📄 Versões

Esta documentação foi criada com base no `package.json` do projeto. Para verificar versões atualizadas, consulte o arquivo `package.json` ou execute:

```bash
npm list --depth=0
```

---

## 🏗️ Arquitetura do Projeto

### Estrutura de Módulos

```
src/
├── app.module.ts           # Módulo raiz
├── main.ts                 # Bootstrap da aplicação
├── auth/                   # Módulo de autenticação
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── auth.guard.ts
│   └── dto/
├── users/                  # Módulo de usuários
│   ├── users.controller.ts
│   ├── users.service.ts
│   └── dto/
├── conversations/          # Módulo de conversas
│   ├── conversations.controller.ts
│   ├── conversations.service.ts
│   └── dto/
├── messages/               # Módulo de mensagens
│   ├── messages.controller.ts
│   ├── messages.service.ts
│   └── dto/
├── posts/                  # Módulo de posts
│   ├── posts.controller.ts
│   ├── posts.service.ts
│   └── dto/
├── firebase/               # Configuração Firebase
│   ├── firebase.module.ts
│   └── firebase.providers.ts
└── common/                 # Utilitários compartilhados
    └── zod-validation.pipe.ts
```

### Padrões Utilizados

- **Modular:** Cada funcionalidade em seu próprio módulo
- **Dependency Injection:** Serviços injetados via construtor
- **DTOs:** Data Transfer Objects para validação
- **Guards:** Proteção de rotas (autenticação)
- **Pipes:** Validação e transformação de dados
- **Providers:** Configuração de serviços externos (Firebase)

---

**Última atualização:** Baseado no `package.json` do projeto GameOn Backend
