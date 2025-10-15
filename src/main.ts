import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:8081',
      'http://localhost:19006',
      'http://192.168.1.100:19000',
      'exp://localhost:19000',
      'exp://t_vdzm4-vitormimaki-8081.exp.direct',
    ],
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
