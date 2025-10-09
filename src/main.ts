import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  });

  const logger = new Logger('Bootstrap');
  const port = process.env.PORT ?? 3000;

  await app
    .listen(port)
    .then(() => {
      logger.log(`Server is running on port ${port}`);
      logger.log(`Application is running on: http://localhost:${port}`);
    })
    .catch((error) => {
      logger.error('Error starting the server:', error);
    });
}
bootstrap().catch((err) => {
  const logger = new Logger('Bootstrap');
  logger.error('Failed to start application', err);
  process.exit(1);
});
