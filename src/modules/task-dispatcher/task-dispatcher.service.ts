import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class TaskDispatcherService {
  constructor(
    @Inject('RABBITMQ_PRODUCER_SERVICE') private readonly queueClient: ClientProxy,
  ) {}

  async sendToQueue(meetingId: string, fileUrl: string) {
    const payload = { meeting_id: meetingId, file_url: fileUrl };
    
    // Bắn lệnh qua RabbitMQ
    this.queueClient.emit('process_audio_task', payload);

    return {
      success: true,
      message: `Tác vụ của meeting ${meetingId} đã được điều phối vào hàng đợi thành công.`,
    };
  }
}