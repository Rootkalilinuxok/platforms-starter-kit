import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as bodyParser from 'body-parser';
import { Request } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
  });

  app.use(
    bodyParser.json({
      limit: '1mb',
      verify: (req: Request, _res, buf) => {
        if ((req.originalUrl || '').startsWith('/billing/webhook')) {
          (req as any).rawBody = Buffer.from(buf);
        }
      },
    }),
  );
  app.use(bodyParser.urlencoded({ extended: true }));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const port = process.env.PORT ? Number(process.env.PORT) : 4000;
  await app.listen(port);
  console.log(`Billing API running on http://localhost:${port}`);
}

bootstrap().catch((error) => {
  console.error('Failed to bootstrap Nest application', error);
  process.exit(1);
});
