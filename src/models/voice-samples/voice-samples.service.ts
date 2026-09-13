import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VoiceSample } from './entities/voice-sample.entity';
import { CreateVoiceSampleDto } from './dto/create-voice-sample.dto';
import { UpdateVoiceSampleDto } from './dto/update-voice-sample.dto';
import { UploadService } from '../../modules/upload/upload.service';
import { MediaConverterService } from '../../modules/MediaConvert/media-converter.service';
import * as mm from 'music-metadata';

@Injectable()
export class VoiceSamplesService {
  constructor(
    @InjectRepository(VoiceSample)
    private readonly voiceSampleRepo: Repository<VoiceSample>,
    private readonly uploadService: UploadService,
    private readonly mediaConverterService: MediaConverterService,
  ) { }

  // 1. Dành cho Python Worker gọi vào khi đã tính toán xong vector (Embedding)
  async saveEmbedding(id: number, embedding: number[]) {
    const record = await this.voiceSampleRepo.findOneBy({ id });
    if (!record) throw new NotFoundException(`Không tìm thấy mẫu giọng nói với ID: ${id}`);

    // Cập nhật mảng vector và đổi trạng thái sang hoàn tất
    record.embedding = embedding;
    record.sampleStatus = 'COMPLETED';

    return await this.voiceSampleRepo.save(record);
  }

  // 2. Quy trình Upload và khởi tạo mẫu giọng nói (Luồng 1)
  async uploadVoiceSample(speakerId: number, file: Express.Multer.File) {
    try {
      console.log(`\n[VOICE SAMPLE] Bắt đầu xử lý file cho Speaker ID: ${speakerId}`);

      // Convert sang WAV chuẩn 16kHz
      const wavFile = await this.mediaConverterService.convertToWav(file);

      // Lấy thời lượng file
      let autoDuration = 0;
      try {
        const metadata = await mm.parseBuffer(wavFile.buffer, wavFile.mimetype);
        autoDuration = metadata.format.duration ? Math.round(metadata.format.duration) : 0;
      } catch (e) {
        console.warn('[VOICE SAMPLE] Không đọc được thời lượng file.');
      }

      // Upload lên Storage (RustFS)
      const uploadResult = await this.uploadService.uploadFile(wavFile);
      if (!uploadResult.success) throw new Error('Storage Service từ chối file');

      // Lưu record vào DB ở trạng thái PENDING
      const newRecord = this.voiceSampleRepo.create({
        speakerId: speakerId,
        storageObjectId: uploadResult.data.id,
        durationSeconds: autoDuration,
        sampleStatus: 'PENDING', // Đợi Python Worker xử lý embedding
      });

      const savedRecord = await this.voiceSampleRepo.save(newRecord);

      // Lấy fileUrl trả về cùng record để Controller gửi sang RabbitMQ
      const fileUrl = await this.uploadService.getFileUrl(uploadResult.data.objectKey);

      return { record: savedRecord, fileUrl };
    } catch (error) {
      console.error('[VOICE SAMPLE ERROR]', error);
      throw new InternalServerErrorException('Lỗi xử lý upload voice sample');
    }
  }

  // 3. Các hàm CRUD cơ bản
  async findAll() {
    const records = await this.voiceSampleRepo.find({
      relations: { speaker: true, storageObject: true },
    });

    return await Promise.all(records.map(async (record) => {
      let freshUrl: string | null = null;
      if (record.storageObject?.objectKey) {
        freshUrl = await this.uploadService.getFileUrl(record.storageObject.objectKey);
      }
      return { ...record, url: freshUrl };
    }));
  }

  async findOne(id: number) {
    const record = await this.voiceSampleRepo.findOne({
      where: { id },
      relations: { speaker: true, storageObject: true },
    });

    if (!record) throw new NotFoundException(`Không tìm thấy dữ liệu ID = ${id}`);

    let freshUrl: string | null = null;
    if (record.storageObject?.objectKey) {
      freshUrl = await this.uploadService.getFileUrl(record.storageObject.objectKey);
    }
    return { ...record, url: freshUrl };
  }

  async update(id: number, updateDto: UpdateVoiceSampleDto) {
    const record = await this.findOne(id);
    const updated = this.voiceSampleRepo.merge(record as VoiceSample, updateDto);
    return await this.voiceSampleRepo.save(updated);
  }

  async remove(id: number) {
    const record = await this.findOne(id);
    await this.voiceSampleRepo.remove(record as VoiceSample);
    return { message: `Đã xóa ID = ${id}` };
  }
}