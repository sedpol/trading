import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

const LOCALHOST_ORIGIN_PATTERN = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
const PRIVATE_NETWORK_ORIGIN_PATTERN =
  /^http:\/\/(10(?:\.\d{1,3}){3}|172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2}|192\.168(?:\.\d{1,3}){2})(:\d+)?$/;

const parsePort = (value: string | undefined) => {
  const parsed = Number.parseInt(value ?? '', 10);

  return Number.isFinite(parsed) ? parsed : 3000;
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const host = process.env.HOST?.trim() || '0.0.0.0';
  const port = parsePort(process.env.PORT);

  app.enableCors({
    origin: (origin, callback) => {
      if (
        !origin
        || LOCALHOST_ORIGIN_PATTERN.test(origin)
        || PRIVATE_NETWORK_ORIGIN_PATTERN.test(origin)
      ) {
        callback(null, true);
        return;
      }

      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Session-Token'],
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  await app.listen(port, host);
}

bootstrap();
