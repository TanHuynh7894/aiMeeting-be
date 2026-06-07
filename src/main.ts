import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { SwaggerTheme, SwaggerThemeNameEnum } from 'swagger-themes';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Lấy các biến từ file .env (hoặc dùng mặc định nếu không có)
  const port = process.env.PORT ?? 3000;
  const baseUrl = process.env.base_url_BE || `http://localhost:${port}`;

  // Cấu hình tài liệu Swagger
  const config = new DocumentBuilder()
    .setTitle('Project API')
    .setDescription('Tài liệu API chi tiết')
    .setVersion('1.0')
    .addServer(baseUrl) // Gắn base_url_BE để test API gọi đúng đích
    .build();

  const document = SwaggerModule.createDocument(app, config);
  
  // Áp dụng Dark Theme cho giao diện Swagger
  const theme = new SwaggerTheme();
  SwaggerModule.setup('api', app, document, {
    explorer: true,
    customCss: theme.getBuffer(SwaggerThemeNameEnum.DARK),
  });

  // Khởi chạy server với port lấy từ .env
  await app.listen(port);
  
  // In ra log để dễ dàng click trực tiếp trên terminal
  console.log(`Application is running on: ${baseUrl}`);
  console.log(`Swagger UI is running on: ${baseUrl}/api`);
}
bootstrap();