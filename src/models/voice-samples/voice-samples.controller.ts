import {
  Controller, Get, Post, Body, Patch, Param, Delete,
  ParseIntPipe, UseInterceptors, UploadedFile, BadRequestException
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { VoiceSamplesService } from './voice-samples.service';
import * as amqp from 'amqplib';
// import { CreateVoiceSampleDto } from './dto/create-voice-sample.dto';
// import { UpdateVoiceSampleDto } from './dto/update-voice-sample.dto';

@ApiTags('Voice Samples')
@Controller('voice-samples')
export class VoiceSamplesController {
  constructor(private readonly voiceSamplesService: VoiceSamplesService) { }

  @Post('upload-sample')
  @ApiOperation({ summary: '1. UPLOAD FILE: Tải lên NAS & Đẩy task vào RabbitMQ' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        speakerId: { type: 'number', example: 1 },
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadVoiceSample(
    @UploadedFile() file: Express.Multer.File,
    @Body('speakerId') speakerId?: string,
  ) {
    if (!file) throw new BadRequestException('Vui lòng đính kèm file media!');
    if (!speakerId) throw new BadRequestException('Vui lòng cung cấp speakerId!');

    const parsedSpeakerId = parseInt(speakerId, 10);

    // 1. Lưu file lên NAS và lấy record, fileUrl từ Service
    const { record, fileUrl } = await this.voiceSamplesService.uploadVoiceSample(parsedSpeakerId, file);

    // 2. Lấy cấu hình RabbitMQ từ môi trường
    const rabbitUser = process.env.RABBITMQ_USER || 'guest';
    const rabbitPassword = process.env.RABBITMQ_PASSWORD || 'guest';
    const rabbitHost = process.env.RABBITMQ_HOST || '127.0.0.1';
    const rabbitPort = process.env.RABBITMQ_PORT || '5672';
    const queueName = process.env.RABBITMQ_QUEUE_VOICE || 'audio_preprocessing_queue';

    const encodedPassword = encodeURIComponent(rabbitPassword);
    const rabbitConnectionUrl = `amqp://${rabbitUser}:${encodedPassword}@${rabbitHost}:${rabbitPort}`;

    try {
      console.log(`[RabbitMQ] Đang kết nối tới ${rabbitHost}:${rabbitPort}...`);
      const connection = await amqp.connect(rabbitConnectionUrl);
      const channel = await connection.createChannel();

      // Đảm bảo queue tồn tại
      await channel.assertQueue(queueName, { durable: true });

      // Đóng gói dữ liệu gửi đi
      const taskPayload = {
        sample_id: record.id,
        file_url: fileUrl
      };

      // Đẩy vào hàng đợi
      channel.sendToQueue(queueName, Buffer.from(JSON.stringify(taskPayload)), { persistent: true });
      console.log(`[RabbitMQ] Thành công! Đã đẩy task xử lý audio ID: ${record.id} vào hàng đợi.`);

      // Đóng kết nối sau khi gửi xong
      setTimeout(() => {
        channel.close();
        connection.close();
      }, 500);

    } catch (error) {
      console.error(`[RabbitMQ Error] Không thể đẩy task vào hàng đợi:`, error);
    }

    return record;
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách toàn bộ Voice Samples (Có kèm link NAS)' })
  findAll() {
    return this.voiceSamplesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết 1 Voice Sample theo ID (Có kèm link NAS)' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.voiceSamplesService.findOne(id);
  }

  @Patch(':id/embedding')
  @ApiOperation({ summary: 'Cập nhật thủ công Vector Embedding cho Voice Sample' })
  async updateEmbedding(@Param('id', ParseIntPipe) id: number, @Body() body: { embedding: number[] }) {
    return this.voiceSamplesService.saveEmbedding(id, body.embedding);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa bản ghi Voice Sample' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.voiceSamplesService.remove(id);
  }
}