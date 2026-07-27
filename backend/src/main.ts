import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Football Field Management API')
    .setDescription('API quản lý sân bóng, khách hàng, đặt sân và thanh toán')
    .setVersion('1.0')
    .addTag('Field Types')
    .addTag('Fields')
    .addTag('Time Slots')
    .addTag('Field Prices')
    .addTag('Customers')
    .addTag('Bookings')
    .addTag('Payments')
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup('api/docs', app, swaggerDocument);

  await app.listen(3001);

  console.log('Backend chạy tại http://localhost:3001/api');
  console.log('Swagger chạy tại http://localhost:3001/api/docs');
}

bootstrap();
