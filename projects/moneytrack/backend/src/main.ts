import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
// cookie-parser uses CommonJS `export =`; this form preserves its callable shape.
// eslint-disable-next-line @typescript-eslint/no-require-imports
import cookieParser = require('cookie-parser');
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  app.setGlobalPrefix('api');
  app.use(helmet({ contentSecurityPolicy: config.get('NODE_ENV') === 'production' ? undefined : false }));
  app.use(cookieParser());
  app.enableCors({ origin: config.getOrThrow<string>('FRONTEND_URL').split(','), credentials: true, methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'] });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true, transformOptions: { enableImplicitConversion: true } }));
  app.useGlobalFilters(new HttpExceptionFilter());
  const document = SwaggerModule.createDocument(app, new DocumentBuilder().setTitle('MoneyTrack API').setDescription('Personal finance accounts, transactions, budgets, analytics and imports').setVersion('1.0').addBearerAuth().addCookieAuth('refresh_token').build());
  SwaggerModule.setup('api/docs', app, document, { swaggerOptions: { persistAuthorization: true } });
  await app.listen(config.get<number>('PORT', 4200), '0.0.0.0');
}

void bootstrap();
