import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const kafkaServer = process.env.KAFKA_SERVER;
  if (!kafkaServer) {
    throw new Error('KAFKA_SERVER environment variable is required');
  }

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        brokers: [kafkaServer],
      },
      consumer: {
        groupId: 'device-configuration-service',
      },
      subscribe: {
        fromBeginning: true,
      },
    },
  });

  await app.startAllMicroservices();
  let port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`device-configuration-service started on port ${port}`);
}
bootstrap();
