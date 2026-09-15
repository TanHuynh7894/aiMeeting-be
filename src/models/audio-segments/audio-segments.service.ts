import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as amqp from 'amqplib';
import { AudioSegment } from './entities/audio-segment.entity';
import { AudioUpload } from '../audio-uploads/entities/audio-upload.entity';
import { CreateAudioSegmentDto } from './dto/create-audio-segment.dto';
import { UpdateAudioSegmentDto } from './dto/update-audio-segment.dto';
import { UploadService } from '../../modules/upload/upload.service';

@Injectable()
export class AudioSegmentsService {
  constructor(
    @InjectRepository(AudioSegment)
    private readonly audioSegmentRepo: Repository<AudioSegment>,
    @InjectRepository(AudioUpload)
    private readonly audioUploadRepo: Repository<AudioUpload>,
    private readonly uploadService: UploadService,
    private readonly configService: ConfigService,
  ) { }

  // 1. Nhận audioUploadId, lấy storage_object_id -> gửi file tới WK_DIARIZE_URL
  async create(createDto: CreateAudioSegmentDto | { audioUploadId: number }) {
    const audioUploadId = createDto.audioUploadId;
    if (!audioUploadId) {
      throw new BadRequestException('Vui lòng cung cấp audioUploadId!');
    }

    // Lấy thông tin AudioUpload kèm StorageObject
    const audioUpload = await this.audioUploadRepo.findOne({
      where: { id: audioUploadId },
      relations: { storageObject: true },
    });

    if (!audioUpload) {
      throw new NotFoundException(`Không tìm thấy AudioUpload với ID = ${audioUploadId}`);
    }

    if (!audioUpload.storageObject || !audioUpload.storageObject.objectKey) {
      throw new BadRequestException(`AudioUpload ID = ${audioUploadId} chưa có thông tin storage_object!`);
    }

    // Lấy presigned URL của file audio gốc từ Storage Service
    const fileUrl = await this.uploadService.getFileUrl(
      audioUpload.storageObject.objectKey,
      audioUpload.storageObject.bucketName,
    );

    if (!fileUrl) {
      throw new InternalServerErrorException('Không lấy được URL file audio gốc từ Storage Service!');
    }

    const wkDiarizeUrl =
      this.configService.get<string>('WK_DIARIZE_URL') ||
      process.env.WK_DIARIZE_URL ||
      'http://100.125.56.43:8008/diarize/process';

    console.log(`\n[DIARIZE] Đang tải file từ Storage Service để gửi sang Worker (AudioUpload ID ${audioUploadId})...`);

    try {
      // 1. Tải file buffer từ presigned URL
      const fileDownloadResponse = await axios.get(fileUrl, { responseType: 'arraybuffer' });
      const fileBuffer = Buffer.from(fileDownloadResponse.data);

      // 2. Tạo FormData chứa file và task_id (là ID của audio_upload)
      const formData = new FormData();
      const fileName = audioUpload.storageObject.originalFileName || 'audio.wav';
      const mimeType = audioUpload.storageObject.mimeType || 'audio/wav';
      const fileBlob = new Blob([fileBuffer], { type: mimeType });

      formData.append('file', fileBlob, fileName);
      formData.append('task_id', String(audioUploadId));

      console.log(`[DIARIZE] Đang gửi multipart/form-data sang Diarization Worker...`);
      console.log(`- Worker URL: ${wkDiarizeUrl}`);
      console.log(`- task_id: ${audioUploadId}`);
      console.log(`- File name: ${fileName}`);

      // 3. Gửi POST form-data sang Worker
      const response = await axios.post(wkDiarizeUrl, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Cập nhật trạng thái AudioUpload
      audioUpload.processingStatus = 'DIARIZING';
      await this.audioUploadRepo.save(audioUpload);

      return {
        success: true,
        message: 'Đã gửi file tới Worker Diarization thành công!',
        audioUploadId: audioUploadId,
        workerResponse: response.data,
      };
    } catch (error: any) {
      console.error('[DIARIZE ERROR] Lỗi khi kết nối với Diarization Worker:', error?.message || error);
      throw new InternalServerErrorException(
        `Lỗi khi kết nối với Diarization Worker: ${error?.response?.data?.detail || error.message}`,
      );
    }
  }

  // 1b. Gửi task audioUpload sang RabbitMQ (Queue: RABBITMQ_QUEUE_AUDIO)
  async sendToDiarizeQueue(audioUploadId: number) {
    const audioUpload = await this.audioUploadRepo.findOne({
      where: { id: audioUploadId },
      relations: { storageObject: true },
    });

    if (!audioUpload) {
      throw new NotFoundException(`Không tìm thấy AudioUpload với ID = ${audioUploadId}`);
    }

    if (!audioUpload.storageObject || !audioUpload.storageObject.objectKey) {
      throw new BadRequestException(`AudioUpload ID = ${audioUploadId} chưa có thông tin storage_object!`);
    }

    const fileUrl = await this.uploadService.getFileUrl(
      audioUpload.storageObject.objectKey,
      audioUpload.storageObject.bucketName,
    );

    if (!fileUrl) {
      throw new InternalServerErrorException('Không lấy được URL file audio gốc từ Storage Service!');
    }

    const rabbitUser = this.configService.get<string>('RABBITMQ_USER') || process.env.RABBITMQ_USER || 'admin';
    const rabbitPassword = this.configService.get<string>('RABBITMQ_PASSWORD') || process.env.RABBITMQ_PASSWORD || '123@123AbcTH';
    const rabbitHost = this.configService.get<string>('RABBITMQ_HOST') || process.env.RABBITMQ_HOST || '192.168.20.195';
    const rabbitPort = this.configService.get<string>('RABBITMQ_PORT') || process.env.RABBITMQ_PORT || '5672';
    const queueName = this.configService.get<string>('RABBITMQ_QUEUE_AUDIO') || process.env.RABBITMQ_QUEUE_AUDIO || 'diarization-audio';

    const encodedPassword = encodeURIComponent(rabbitPassword);
    const rabbitConnectionUrl = `amqp://${rabbitUser}:${encodedPassword}@${rabbitHost}:${rabbitPort}`;

    try {
      console.log(`[RabbitMQ Diarize] Đang kết nối tới ${rabbitHost}:${rabbitPort}...`);
      const connection = await amqp.connect(rabbitConnectionUrl);
      const channel = await connection.createChannel();

      await channel.assertQueue(queueName, { durable: true });

      const taskPayload = {
        audio_id: audioUploadId,
        audio_upload_id: audioUploadId,
        task_id: audioUploadId,
        file_url: fileUrl,
      };

      channel.sendToQueue(queueName, Buffer.from(JSON.stringify(taskPayload)), { persistent: true });
      console.log(`[RabbitMQ Diarize] Thành công! Đã đẩy task audioUploadId: ${audioUploadId} vào hàng đợi [${queueName}].`);

      await channel.close();
      await connection.close();

      audioUpload.processingStatus = 'DIARIZING';
      await this.audioUploadRepo.save(audioUpload);

      return {
        success: true,
        message: `Đã đẩy task của AudioUpload ID ${audioUploadId} vào hàng đợi RabbitMQ [${queueName}] thành công!`,
        audioUploadId: audioUploadId,
        queue: queueName,
      };
    } catch (error: any) {
      console.error(`[RabbitMQ Error] Không thể đẩy task vào hàng đợi:`, error);
      throw new InternalServerErrorException(`Lỗi khi kết nối hoặc gửi task sang RabbitMQ: ${error.message}`);
    }
  }

  // 2. Nhận 1 file segment được cắt ra -> lưu vào Storage Service (S3_BUCKET_DIARIZE) -> lưu DB audio_segments
  async uploadSegmentFile(
    audioUploadId: number,
    file: Express.Multer.File,
    startTime?: number,
    endTime?: number,
    confidenceScore?: number,
  ) {
    // Kiểm tra AudioUpload tồn tại
    const audioUpload = await this.audioUploadRepo.findOneBy({ id: audioUploadId });
    if (!audioUpload) {
      throw new NotFoundException(`Không tìm thấy AudioUpload với ID = ${audioUploadId}`);
    }

    console.log(`\n[AUDIO SEGMENT] Lưu segment file cho AudioUpload ID: ${audioUploadId}...`);

    // Target Bucket từ S3_BUCKET_DIARIZE env
    const targetBucket =
      this.configService.get<string>('S3_BUCKET_DIARIZE') ||
      process.env.S3_BUCKET_DIARIZE ||
      'meeting-diarize';

    // Lưu file vào NAS qua UploadService với targetBucket
    const uploadResult = await this.uploadService.uploadFile(file, targetBucket);

    if (!uploadResult.success || !uploadResult.data) {
      throw new InternalServerErrorException('Lỗi: Không thể lưu file segment vào Storage Service');
    }

    // Tạo bản ghi mới trong bảng audio_segments
    const segment = this.audioSegmentRepo.create({
      audioUploadId: audioUploadId,
      segmentStorageObjectId: uploadResult.data.id,
      startTime: startTime ?? 0,
      endTime: endTime ?? 0,
      confidenceScore: confidenceScore ?? 0,
    });

    const savedSegment = await this.audioSegmentRepo.save(segment);

    return {
      success: true,
      message: 'Đã lưu segment audio thành công!',
      data: savedSegment,
      url: uploadResult.url,
    };
  }

  // 3. Nhận nhiều file segments cắt ra cùng lúc
  async uploadMultipleSegments(
    audioUploadId: number,
    files: Express.Multer.File[],
    metadataList?: Array<{ startTime?: number; endTime?: number; confidenceScore?: number }>,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('Không có file segment nào được đính kèm!');
    }

    const results: AudioSegment[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const meta = metadataList && metadataList[i] ? metadataList[i] : {};
      const result = await this.uploadSegmentFile(
        audioUploadId,
        file,
        meta.startTime,
        meta.endTime,
        meta.confidenceScore,
      );
      results.push(result.data);
    }

    return {
      success: true,
      message: `Đã lưu thành công ${results.length} segments cho AudioUpload ID = ${audioUploadId}`,
      data: results,
    };
  }

  async findAll() {
    const records = await this.audioSegmentRepo.find({
      relations: { audioUpload: true, segmentStorageObject: true },
    });

    return await Promise.all(
      records.map(async (record) => {
        let freshUrl: string | null = null;
        if (record.segmentStorageObject?.objectKey) {
          freshUrl = await this.uploadService.getFileUrl(
            record.segmentStorageObject.objectKey,
            record.segmentStorageObject.bucketName,
          );
        }
        return { ...record, url: freshUrl };
      }),
    );
  }

  async findOne(id: number) {
    const record = await this.audioSegmentRepo.findOne({
      where: { id },
      relations: { audioUpload: true, segmentStorageObject: true },
    });
    if (!record) throw new NotFoundException(`Không tìm thấy dữ liệu ID = ${id}`);

    let freshUrl: string | null = null;
    if (record.segmentStorageObject?.objectKey) {
      freshUrl = await this.uploadService.getFileUrl(
        record.segmentStorageObject.objectKey,
        record.segmentStorageObject.bucketName,
      );
    }
    return { ...record, url: freshUrl };
  }

  async update(id: number, updateDto: UpdateAudioSegmentDto) {
    const record = await this.findOne(id);
    Object.assign(record, updateDto);
    return await this.audioSegmentRepo.save(record);
  }

  async remove(id: number) {
    const record = await this.findOne(id);
    await this.audioSegmentRepo.remove(record);
    return { message: `Đã xóa thành công ID = ${id}` };
  }

  async getSegmentDetailWithSpeakers(audioUploadId: number, audioSegmentId: number) {
    const segment = await this.audioSegmentRepo.findOne({
      where: { id: audioSegmentId, audioUploadId },
      relations: { segmentStorageObject: true, audioUpload: true },
    });

    if (!segment) {
      throw new NotFoundException(
        `Không tìm thấy AudioSegment với ID = ${audioSegmentId} thuộc AudioUpload ID = ${audioUploadId}`,
      );
    }

    let segmentUrl: string | null = null;
    if (segment.segmentStorageObject?.objectKey) {
      segmentUrl = await this.uploadService.getFileUrl(
        segment.segmentStorageObject.objectKey,
        segment.segmentStorageObject.bucketName,
      );
    }

    const audioUpload = await this.audioUploadRepo.findOne({
      where: { id: audioUploadId },
      relations: {
        audioUploadSpeakers: {
          speaker: {
            voiceSamples: {
              storageObject: true,
            },
          },
        },
      },
    });

    const speakers = await Promise.all(
      (audioUpload?.audioUploadSpeakers || []).map(async (aus) => {
        const speakerObj = aus.speaker;
        let voiceSamplesWithUrls: any[] = [];
        if (speakerObj && speakerObj.voiceSamples) {
          voiceSamplesWithUrls = await Promise.all(
            speakerObj.voiceSamples.map(async (vs) => {
              let vsUrl: string | null = null;
              if (vs.storageObject?.objectKey) {
                vsUrl = await this.uploadService.getFileUrl(
                  vs.storageObject.objectKey,
                  vs.storageObject.bucketName,
                );
              }
              return {
                ...vs,
                url: vsUrl,
              };
            }),
          );
        }

        return {
          speakerId: aus.speakerId,
          speaker: {
            ...speakerObj,
            voiceSamples: voiceSamplesWithUrls,
          },
          linkedAt: aus.createdAt,
        };
      }),
    );

    return {
      success: true,
      audioUploadId,
      audioSegmentId,
      audioSegment: {
        ...segment,
        url: segmentUrl,
      },
      speakersCount: speakers.length,
      speakers,
    };
  }

  async sendIdentificationTask(audioUploadId: number, audioSegmentId: number) {
    const payload = await this.getSegmentDetailWithSpeakers(audioUploadId, audioSegmentId);

    // 1. Đẩy toàn bộ JSON payload lên RabbitMQ (Queue: RABBITMQ_QUEUE_Identification)
    const rabbitUser = this.configService.get<string>('RABBITMQ_USER') || process.env.RABBITMQ_USER || 'admin';
    const rabbitPassword = this.configService.get<string>('RABBITMQ_PASSWORD') || process.env.RABBITMQ_PASSWORD || '123@123AbcTH';
    const rabbitHost = this.configService.get<string>('RABBITMQ_HOST') || process.env.RABBITMQ_HOST || '192.168.20.195';
    const rabbitPort = this.configService.get<string>('RABBITMQ_PORT') || process.env.RABBITMQ_PORT || '5672';
    const queueName =
      this.configService.get<string>('RABBITMQ_QUEUE_Identification') ||
      process.env.RABBITMQ_QUEUE_Identification ||
      'Identification';

    let mqSuccess = false;
    let mqError: string | null = null;

    try {
      const encodedPassword = encodeURIComponent(rabbitPassword);
      const rabbitConnectionUrl = `amqp://${rabbitUser}:${encodedPassword}@${rabbitHost}:${rabbitPort}`;
      console.log(`[RabbitMQ Identification] Đang kết nối tới ${rabbitHost}:${rabbitPort}...`);
      const connection = await amqp.connect(rabbitConnectionUrl);
      const channel = await connection.createChannel();

      await channel.assertQueue(queueName, { durable: true });
      channel.sendToQueue(queueName, Buffer.from(JSON.stringify(payload)), { persistent: true });
      console.log(`[RabbitMQ Identification] Thành công! Đã đẩy JSON vào hàng đợi [${queueName}].`);

      await channel.close();
      await connection.close();
      mqSuccess = true;
    } catch (err: any) {
      console.error(`[RabbitMQ Identification Error]:`, err?.message || err);
      mqError = err?.message || String(err);
    }

    // 2. Gọi về Worker WK_Identification_URL truyền JSON payload này sang
    const wkIdentificationUrl =
      this.configService.get<string>('WK_Identification_URL') ||
      process.env.WK_Identification_URL || "";

    let workerResponse: any = null;
    let workerSuccess = false;

    try {
      console.log(`[Worker Identification] Đang gửi POST JSON tới ${wkIdentificationUrl}...`);
      const response = await axios.post(wkIdentificationUrl, payload, {
        headers: { 'Content-Type': 'application/json' },
      });
      workerResponse = response.data;
      workerSuccess = true;
      console.log(`[Worker Identification] Phản hồi từ worker thành công:`, workerResponse);
    } catch (err: any) {
      console.error(`[Worker Identification Error]:`, err?.response?.data || err?.message || err);
      workerResponse = err?.response?.data || { error: err?.message || String(err) };
    }

    return {
      ...payload,
      rabbitMq: {
        queue: queueName,
        sent: mqSuccess,
        error: mqError,
      },
      worker: {
        url: wkIdentificationUrl,
        sent: workerSuccess,
        response: workerResponse,
      },
    };
  }

  async sendAllIdentificationTasks(audioUploadId: number) {
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
      `\n[IDENTIFY ALL] Tìm thấy ${segments.length} segments thuộc AudioUpload ID = ${audioUploadId}. Đang lần lượt xử lý...`,
    );

    const results: any[] = [];
    for (const seg of segments) {
      const result = await this.sendIdentificationTask(audioUploadId, seg.id);
      results.push(result);
    }

    return {
      success: true,
      message: `Đã xử lý xong toàn bộ ${results.length} audio segments cho AudioUpload ID = ${audioUploadId}`,
      audioUploadId,
      totalSegments: segments.length,
      processedCount: results.length,
      results,
    };
  }
}


