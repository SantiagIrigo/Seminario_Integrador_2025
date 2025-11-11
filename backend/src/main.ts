import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Configuración para parsear el body de las peticiones
  app.use(require('body-parser').json({ limit: '50mb' }));
  app.use(require('body-parser').urlencoded({ extended: true, limit: '50mb' }));
  
  // Configuración de CORS
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  });
  
  // Pipes globales
  app.useGlobalPipes(new ValidationPipe());
  
  // Filtro global de excepciones
  app.useGlobalFilters(new AllExceptionsFilter());
  
  // Configura Swagger en desarrollo
  if (process.env.NODE_ENV !== 'production') {
    const { DocumentBuilder, SwaggerModule } = require('@nestjs/swagger');
    
    const config = new DocumentBuilder()
      .setTitle('Sistema de Autogestión Académica')
      .setDescription('API para gestión académica de estudiantes')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
      
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);
    
    const redocConfig = new DocumentBuilder()
      .setTitle('Sistema de Autogestión Académica')
      .setDescription('API para gestión académica de estudiantes')
      .setVersion('1.0')
      .build();
      
    const redocDocument = SwaggerModule.createDocument(app, redocConfig);
    SwaggerModule.setup('redoc', app, redocDocument, {
      explorer: true,
      customCss: '.swagger-ui .topbar { display: none }'
    });
  }
  
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
