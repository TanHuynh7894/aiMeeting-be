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
  ) {}

  async create(createDto: CreateVoiceSampleDto) {
    const newRecord = this.voiceSampleRepo.create(createDto);
    return await this.voiceSampleRepo.save(newRecord);
  }

  async findAll() {
    const records = await this.voiceSampleRepo.find({ 
      relations: { speaker: true, storageObject: true } 
    });

    // Tạo link trực tiếp cho từng bản ghi
    return await Promise.all(records.map(async (record) => {
      let freshUrl: string | null = null; 
      
      if (record.storageObject && record.storageObject.objectKey) {
        freshUrl = await this.uploadService.getFileUrl(record.storageObject.objectKey);
      }

      return {
        ...record,
        url: freshUrl
      };
    }));
  }

  async findOne(id: number) {
    const record = await this.voiceSampleRepo.findOne({ 
      where: { id }, 
      relations: { speaker: true, storageObject: true } 
    });
    
    if (!record) throw new NotFoundException(`Không tìm thấy dữ liệu ID = ${id}`);

    let freshUrl: string | null = null; 
    if (record.storageObject && record.storageObject.objectKey) {
      freshUrl = await this.uploadService.getFileUrl(record.storageObject.objectKey);
    }

    return {
      ...record,
      url: freshUrl
    };
  }

  async update(id: number, updateDto: UpdateVoiceSampleDto) {
    const record = await this.findOne(id);
    Object.assign(record, updateDto);
    return await this.voiceSampleRepo.save(record);
  }

  async remove(id: number) {
    const record = await this.findOne(id);
    await this.voiceSampleRepo.remove(record);
    return { message: `Đã xóa thành công ID = ${id}` };
  }

  async uploadVoiceSample(speakerId: number, file: Express.Multer.File) {
    try {
      console.log('\n[VOICE SAMPLE] Đang bắt đầu quy trình upload mẫu giọng nói...');
      const wavFile = await this.mediaConverterService.convertToWav(file);
      let autoDuration = 0;
      try {
        const metadata = await mm.parseBuffer(wavFile.buffer, wavFile.mimetype);
        if (metadata.format.duration) {
          autoDuration = Math.round(metadata.format.duration);
          console.log(`[VOICE SAMPLE] Đã tính được thời lượng: ${autoDuration} giây`);
        }
      } catch (metadataError: any) {
        console.warn(`[VOICE SAMPLE] Lỗi đọc thời lượng: ${metadataError.message}`);
      }
      const uploadResult = await this.uploadService.uploadFile(wavFile);

      if (!uploadResult.success || !uploadResult.data) {
        throw new InternalServerErrorException('Lỗi: Không lấy được thông tin từ Storage Service');
      }

      const storageObjectId = uploadResult.data.id;
      console.log(`[VOICE SAMPLE] Đã đẩy lên NAS thành công. Storage Object ID: ${storageObjectId}`);

      const newVoiceRecord = this.voiceSampleRepo.create({
        speaker: { id: speakerId } as any,             
        storageObject: { id: storageObjectId } as any, 
        durationSeconds: autoDuration,                
        sampleStatus: 'PENDING',                       
      });

      const savedVoiceRecord = await this.voiceSampleRepo.save(newVoiceRecord);
      
      console.log('[VOICE SAMPLE] Hoàn tất lưu dữ liệu mẫu giọng nói!');

      return {
        success: true,
        message: 'Upload và convert mẫu giọng nói sang WAV thành công!',
        data: savedVoiceRecord,
        url: uploadResult.url 
      };

    } catch (error) {
      console.error('\n[VOICE SAMPLE - LỖI]', error);
      throw new InternalServerErrorException('Có lỗi xảy ra trong quá trình tải lên Voice Sample');
    }
  }
}