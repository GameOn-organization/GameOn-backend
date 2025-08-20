# GameOn Backend

Backend da aplicação GameOn desenvolvido com NestJS e Firebase Functions.

## 📋 Descrição

O GameOn Backend é uma API REST desenvolvida utilizando o framework NestJS, configurada para ser executada tanto localmente quanto como uma Firebase Function. O projeto oferece uma base sólida para desenvolvimento de APIs com arquitetura modular e escalável.

##  Arquitetura

O projeto utiliza:
- **NestJS**: Framework Node.js para construção de aplicações escaláveis
- **Firebase Functions**: Para deploy na nuvem
- **TypeScript**: Linguagem de programação tipada
- **Express**: Framework web para Node.js (usado pelo NestJS)

### Estrutura do Projeto

```
gameon-backend/
├── src/
│   ├── app.controller.ts    # Controlador principal
│   ├── app.service.ts       # Serviço principal
│   ├── app.module.ts        # Módulo principal
│   └── main.ts             # Ponto de entrada da aplicação
├── test/                   # Testes automatizados
├── firebase.json           # Configuração do Firebase
├── index.ts               # Ponto de entrada para Firebase Functions
└── package.json           # Dependências e scripts
```

##  Como Executar Localmente

### Pré-requisitos

- **Node.js**: Versão 22 ou superior
- **npm**: Gerenciador de pacotes do Node.js
- **Firebase CLI** (opcional): Para deploy e emuladores

### Instalação

1. **Clone o repositório**
   ```bash
   git clone <url-do-repositorio>
   cd gameon-backend
   ```

2. **Instale as dependências**
   ```bash
   npm install
   ```

### Executando o Projeto

#### Desenvolvimento Local

Para executar em modo de desenvolvimento com hot-reload:

```bash
npm run start:dev
```

A aplicação estará disponível em: `http://localhost:3000`

#### Outros Comandos Disponíveis

- **Build do projeto**:
  ```bash
  npm run build
  ```

- **Executar em modo produção**:
  ```bash
  npm run start:prod
  ```

- **Executar com debug**:
  ```bash
  npm run start:debug
  ```

- **Executar testes**:
  ```bash
  npm run test
  ```

- **Executar testes em modo watch**:
  ```bash
  npm run test:watch
  ```

- **Executar testes e2e**:
  ```bash
  npm run test:e2e
  ```

### Firebase Functions (Opcional)

Se você quiser executar como Firebase Function localmente:

1. **Instale o Firebase CLI**:
   ```bash
   npm install -g firebase-tools
   ```

2. **Faça login no Firebase**:
   ```bash
   firebase login
   ```

3. **Execute os emuladores**:
   ```bash
   npm run serve
   ```

##  Endpoints da API

### Endpoint Principal
- **GET** `/` - Retorna uma mensagem de boas-vindas

##  Scripts Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run build` | Compila o projeto TypeScript |
| `npm run start` | Inicia a aplicação |
| `npm run start:dev` | Inicia em modo desenvolvimento com hot-reload |
| `npm run start:debug` | Inicia em modo debug |
| `npm run start:prod` | Inicia em modo produção |
| `npm run test` | Executa os testes unitários |
| `npm run test:watch` | Executa testes em modo watch |
| `npm run test:e2e` | Executa testes end-to-end |
| `npm run lint` | Executa o linter e corrige problemas |
| `npm run format` | Formata o código com Prettier |
| `npm run serve` | Executa Firebase emuladores |
| `npm run deploy` | Faz deploy para Firebase Functions |

## 🔧 Configuração

### Variáveis de Ambiente

O projeto utiliza as seguintes variáveis de ambiente:

- `PORT`: Porta onde a aplicação será executada (padrão: 3000)

### Configuração do Firebase

O projeto está configurado para ser deployado como Firebase Function. O arquivo `firebase.json` contém as configurações necessárias para o deploy.

##  Testes

O projeto inclui configuração completa para testes:

- **Testes Unitários**: Usando Jest
- **Testes E2E**: Para testes de integração
- **Cobertura de Código**: Relatórios de cobertura automáticos

Para executar os testes com cobertura:
```bash
npm run test:cov
```

## 📦 Deploy

### Deploy para Firebase Functions

1. **Configure o projeto Firebase** (se ainda não configurado):
   ```bash
   firebase init functions
   ```

2. **Faça o deploy**:
   ```bash
   npm run deploy
   ```

### Deploy Manual

1. **Build do projeto**:
   ```bash
   npm run build
   ```

2. **Deploy via Firebase CLI**:
   ```bash
   firebase deploy --only functions
   ```

## 🛠️ Desenvolvimento

### Adicionando Novos Endpoints

1. Crie um novo controller em `src/`
2. Crie um novo service se necessário
3. Registre o controller no módulo apropriado
4. Adicione testes para o novo endpoint

### Estrutura de Código

O projeto segue as convenções do NestJS:
- **Controllers**: Responsáveis por receber requisições HTTP
- **Services**: Contêm a lógica de negócio
- **Modules**: Organizam a estrutura da aplicação

## 📝 Licença

Este projeto é privado e não licenciado.

## 👥 Contribuição

Para contribuir com o projeto:

1. Faça um fork do repositório
2. Crie uma branch para sua feature
3. Implemente suas mudanças
4. Adicione testes
5. Execute os testes e linting
6. Faça commit das mudanças
7. Abra um Pull Request

## 📞 Suporte

Para dúvidas ou problemas, entre em contato com a equipe de desenvolvimento.