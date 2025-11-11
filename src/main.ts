import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const port = process.env.PORT ?? 3000;

  console.log(' [MAIN] Iniciando servidor NestJS...');
  console.log(' [MAIN] Porta:', port);

  // CORS configurado para aceitar requisições de qualquer origem (desenvolvimento)
  app.enableCors({
    origin: true, // Aceita qualquer origem
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true,
  });

  console.log(' [MAIN] CORS configurado');

  // Middleware para logar todas as requisições recebidas
  app.use((req, res, next) => {
    console.log(` [REQUEST] ${req.method} ${req.url}`);
    console.log(` [REQUEST] Origin: ${req.headers.origin || 'N/A'}`);
    console.log(` [REQUEST] IP: ${req.ip || req.connection.remoteAddress}`);
    next();
  });

  await app.listen(port, '0.0.0.0'); // Escutar em todas as interfaces de rede
  console.log(` [MAIN] Servidor rodando em http://localhost:${port}`);
  console.log(` [MAIN] Servidor também acessível via IP da rede local na porta ${port}`);
  console.log(` [MAIN] Pronto para receber requisições!`);
  console.log(` [MAIN] Para descobrir seu IP: hostname -I (Linux) ou ipconfig (Windows)`);
}
void bootstrap();
