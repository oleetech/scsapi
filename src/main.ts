import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { use } from 'passport';
import { ValidationPipe } from '@nestjs/common';
import * as cors from 'cors';
import * as dotenv from 'dotenv'; // Import dotenv

async function bootstrap() {
  dotenv.config(); // Load environment variables from .env file

  const app = await NestFactory.create(AppModule);
  
  app.useGlobalPipes(new ValidationPipe());
  
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000', // Use CORS_ORIGIN from .env, or fallback to localhost:3000
      credentials: true, // Allow including credentials (cookies, authorization headers, etc.)
    }),
  );
  
  await app.listen(process.env.PORT || 4000); // Use PORT from .env, or fallback to 4000
}

bootstrap();
