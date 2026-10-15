import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { UploadExceptionFilter } from './common/upload/upload-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });

  // Za nginx: ať rate limiter (a logy) vidí reálnou IP klienta z X-Forwarded-For,
  // ne IP proxy. Bez toho by throttler počítal všechny uživatele jako jednu IP
  // a buď nechytal boty, nebo zablokoval všechny najednou. nginx musí v /api
  // bloku posílat `proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;`.
  app.set('trust proxy', 1);

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new UploadExceptionFilter());

  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  await app.listen(process.env.PORT || 3001);
  console.log(`Backend running on http://localhost:${process.env.PORT || 3001}/api`);
}
bootstrap();
