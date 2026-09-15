import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as amqp from 'amqplib';
import { Transcript } from './entities/transcript.entity';
import { AudioSegment } from '../audio-segments/entities/audio-segment.entity';
import { AudioUpload } from '../audio-uploads/entities/audio-upload.entity';
import { CreateTranscriptDto, SttCallbackDto } from './dto/create-transcript.dto';
import { UpdateTranscriptDto } from './dto/update-transcript.dto';
import { UploadService } from '../../modules/upload/upload.service';

@Injectable()
export class TranscriptsService {
  constructor(
    @InjectRepository(Transcript)
    private readonly transcriptRepo: Repository<Transcript>,
    @InjectRepository(AudioSegment)
    private readonly audioSegmentRepo: Repository<AudioSegment>,
    @InjectRepository(AudioUpload)
    private readonly audioUploadRepo: Repository<AudioUpload>,
    private readonly uploadService: UploadService,
    private readonly configService: ConfigService,
  ) {}

  // 1. API Gửi file audio_segment tới WK_STT_URL & RabbitMQ (stt-audio)
  async sendSegmentToStt(audioSegmentId: number) {
    const segment = await this.audioSegmentRepo.findOne({
      where: { id: audioSegmentId },
      relations: { segmentStorageObject: true, audioUpload: true },
    });

    if (!segment) {
      throw new NotFoundException(`Không tìm thấy AudioSegment với ID = ${audioSegmentId}`);
    }

    if (!segment.segmentStorageObject || !segment.segmentStorageObject.objectKey) {
      throw new BadRequestException(`AudioSegment ID = ${audioSegmentId} chưa có thông tin storage_object!`);
    }

    const fileUrl = await this.uploadService.getFileUrl(
      segment.segmentStorageObject.objectKey,
      segment.segmentStorageObject.bucketName,
    );

    if (!fileUrl) {
      throw new InternalServerErrorException('Không lấy được URL file audio segment từ Storage Service!');
    }

    const wkSttUrl =
      this.configService.get<string>('WK_STT_URL') ||
      process.env.WK_STT_URL ||
      'http://100.125.56.43:8088/audio-segments/identify';

    console.log(`\n[STT WORKER] Đang tải file segment từ Storage Service (Segment ID ${audioSegmentId})...`);

    let workerResponse: any = null;
    let workerSuccess = false;

    try {
      // Tải file buffer từ presigned URL
      const fileDownloadResponse = await axios.get(fileUrl, { responseType: 'arraybuffer' });
      const fileBuffer = Buffer.from(fileDownloadResponse.data);

      const formData = new FormData();
      const fileName = segment.segmentStorageObject.originalFileName || `segment_${audioSegmentId}.wav`;
      const mimeType = segment.segmentStorageObject.mimeType || 'audio/wav';
      const fileBlob = new Blob([fileBuffer], { type: mimeType });

      formData.append('file', fileBlob, fileName);
      formData.append('audio_segment_id', String(audioSegmentId));
      formData.append('audio_upload_id', String(segment.audioUploadId));

      console.log(`[STT WORKER] Đang gửi multipart/form-data tới STT Worker...`);
      console.log(`- Worker URL: ${wkSttUrl}`);
      console.log(`- audio_segment_id: ${audioSegmentId}`);
      console.log(`- audio_upload_id: ${segment.audioUploadId}`);

      const response = await axios.post(wkSttUrl, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      workerResponse = response.data;
      workerSuccess = true;
      console.log(`[STT WORKER] Phản hồi từ STT Worker thành công:`, workerResponse);
    } catch (error: any) {
      console.error('[STT WORKER ERROR] Lỗi khi kết nối với STT Worker:', error?.message || error);
      workerResponse = error?.response?.data || { error: error?.message || String(error) };
    }

    // Đẩy task sang RabbitMQ STT Queue (stt-audio)
    const rabbitUser = this.configService.get<string>('RABBITMQ_USER') || process.env.RABBITMQ_USER || 'admin';
    const rabbitPassword = this.configService.get<string>('RABBITMQ_PASSWORD') || process.env.RABBITMQ_PASSWORD || '123@123AbcTH';
    const rabbitHost = this.configService.get<string>('RABBITMQ_HOST') || process.env.RABBITMQ_HOST || '192.168.20.195';
    const rabbitPort = this.configService.get<string>('RABBITMQ_PORT') || process.env.RABBITMQ_PORT || '5672';
    const queueName = this.configService.get<string>('RABBITMQ_QUEUE_STT') || process.env.RABBITMQ_QUEUE_STT || 'stt-audio';

    let mqSuccess = false;
    let mqError: string | null = null;

    try {
      const encodedPassword = encodeURIComponent(rabbitPassword);
      const rabbitConnectionUrl = `amqp://${rabbitUser}:${encodedPassword}@${rabbitHost}:${rabbitPort}`;
      console.log(`[RabbitMQ STT] Đang kết nối tới ${rabbitHost}:${rabbitPort}...`);
      const connection = await amqp.connect(rabbitConnectionUrl);
      const channel = await connection.createChannel();

      await channel.assertQueue(queueName, { durable: true });

      const taskPayload = {
        audio_segment_id: audioSegmentId,
        audio_upload_id: segment.audioUploadId,
        file_url: fileUrl,
      };

      channel.sendToQueue(queueName, Buffer.from(JSON.stringify(taskPayload)), { persistent: true });
      console.log(`[RabbitMQ STT] Thành công! Đã đẩy task audioSegmentId: ${audioSegmentId} vào hàng đợi [${queueName}].`);

      await channel.close();
      await connection.close();
      mqSuccess = true;
    } catch (mqErr: any) {
      console.error(`[RabbitMQ STT Error]:`, mqErr?.message || mqErr);
      mqError = mqErr?.message || String(mqErr);
    }

    return {
      success: workerSuccess || mqSuccess,
      message: 'Đã gửi file audio segment sang STT Worker & RabbitMQ!',
      audioSegmentId,
      audioUploadId: segment.audioUploadId,
      fileUrl,
      worker: {
        url: wkSttUrl,
        sent: workerSuccess,
        response: workerResponse,
      },
      rabbitMq: {
        queue: queueName,
        sent: mqSuccess,
        error: mqError,
      },
    };
  }

  // 2. API Nhận kết quả từ AI-Server/Worker và thêm mới vào bảng transcripts
  async saveSttCallback(dto: SttCallbackDto | any) {
    const rawSegmentId =
      dto?.audioSegmentId ??
      dto?.audio_segment_id ??
      dto?.['audio-segment-id'] ??
      dto?.['audio-segments-id'] ??
      dto?.audio_segments_id ??
      dto?.segmentId ??
      dto?.segment_id;

    const audioSegmentId = rawSegmentId !== undefined ? Number(rawSegmentId) : undefined;

    const transcriptText =
      dto?.transcriptText ??
      dto?.transcript_text ??
      dto?.['transcript-text'] ??
      dto?.text ??
      dto?.transcript;

    if (!transcriptText) {
      throw new BadRequestException('Vui lòng cung cấp nội dung transcript (transcriptText / transcript_text)!');
    }

    let audioUploadId = dto?.audioUploadId ?? dto?.audio_upload_id ?? dto?.['audio-upload-id'];
    if (audioUploadId !== undefined) {
      audioUploadId = Number(audioUploadId);
    }

    if (!audioUploadId && audioSegmentId) {
      const segment = await this.audioSegmentRepo.findOneBy({ id: audioSegmentId });
      if (segment) {
        audioUploadId = segment.audioUploadId;
      }
    }

    const newTranscript = this.transcriptRepo.create({
      audioUploadId: audioUploadId,
      audioSegmentId: audioSegmentId,
      transcriptText: String(transcriptText),
    });

    const savedRecord = await this.transcriptRepo.save(newTranscript);

    return {
      success: true,
      message: 'Đã lưu kết quả transcript thành công vào database!',
      data: savedRecord,
    };
  }

  async create(createDto: CreateTranscriptDto) {
    return await this.saveSttCallback(createDto);
  }

  async findAll() {
    return await this.transcriptRepo.find({ 
      relations: { audioUpload: true, audioSegment: true } 
    });
  }

  async findOne(id: number) {
    const record = await this.transcriptRepo.findOne({ 
      where: { id }, 
      relations: { audioUpload: true, audioSegment: true } 
    });
    if (!record) throw new NotFoundException(`Không tìm thấy dữ liệu ID = ${id}`);
    return record;
  }

  async update(id: number, updateDto: UpdateTranscriptDto) {
    const record = await this.findOne(id);
    Object.assign(record, updateDto);
    return await this.transcriptRepo.save(record);
  }

  async remove(id: number) {
    const record = await this.findOne(id);
    await this.transcriptRepo.remove(record);
    return { message: `Đã xóa thành công ID = ${id}` };
  }

  // 3. API Tự động lấy toàn bộ audio-segment-id của audioUploadId và lần lượt gửi sang STT Worker & RabbitMQ
  async sendAllSegmentsToSttByUploadId(audioUploadId: number) {
    const segments = await this.audioSegmentRepo.find({
      where: { audioUploadId },
      order: { id: 'ASC' },
    });

    if (!segments || segments.length === 0) {
      throw new NotFoundException(
        `Không tìm thấy bất kỳ AudioSegment nào thuộc AudioUpload ID = ${audioUploadId}`,
      );
    }

    console.log(
      `\n[STT ALL] Tìm thấy ${segments.length} segments thuộc AudioUpload ID = ${audioUploadId}. Đang lần lượt gửi sang STT Worker...`,
    );

    const results: any[] = [];
    for (const seg of segments) {
      const result = await this.sendSegmentToStt(seg.id);
      results.push(result);
    }

    return {
      success: true,
      message: `Đã gửi STT thành công cho toàn bộ ${results.length} audio segments thuộc AudioUpload ID = ${audioUploadId}`,
      audioUploadId,
      totalSegments: segments.length,
      processedCount: results.length,
      results,
    };
  }
}
