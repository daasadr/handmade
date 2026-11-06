import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { UploadExceptionFilter } from './common/upload/upload-exception.filter';

async function bootstrap() {
  // Fail-fast: bez silného JWT_SECRET by se tokeny podepisovaly veřejně známým
  // řetězcem a kdokoli by si mohl zfalšovat přihlášení (i admina). Radši spadnout
  // při startu s jasnou hláškou než tiše běžet nebezpečně.
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error(
      'JWT_SECRET musí být nastaven a mít aspoň 32 znaků. Doplň ho do .env (např. `openssl rand -base64 48`).',
    );
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });

  // Bezpečnostní hlavičky (nosniff, frameguard, HSTS, referrer-policy). CSP
  // vypínáme — tohle je JSON API, CSP patří na frontend/nginx a defaultní by
  // mohla překvapit.
  app.use(helmet({ contentSecurityPolicy: false }));

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
