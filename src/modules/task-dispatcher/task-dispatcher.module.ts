import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { TaskDispatcherController } from './task-dispatcher.controller';
import { TaskDispatcherService } from './task-dispatcher.service';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'RABBITMQ_PRODUCER_SERVICE',
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => {
          const user = configService.get<string>('RABBITMQ_USER');
          const pass = configService.get<string>('RABBITMQ_PASSWORD');
          const host = configService.get<string>('RABBITMQ_HOST');
          const port = configService.get<string>('RABBITMQ_PORT');
          const queue = configService.get<string>('RABBITMQ_QUEUE');

          const amqpUrl = `amqp://${user}:${pass}@${host}:${port}`;

          return {
            transport: Transport.RMQ,
            options: {
              urls: [amqpUrl],
              queue: queue,
              queueOptions: {
                durable: true,
              },
            },
          };
        },
      },
    ]),
  ],
  controllers: [TaskDispatcherController],
  providers: [TaskDispatcherService],
})
export class TaskDispatcherModule {}