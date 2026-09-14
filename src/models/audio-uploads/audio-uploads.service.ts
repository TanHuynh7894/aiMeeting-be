import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AudioUpload } from './entities/audio-upload.entity';
import { CreateAudioUploadDto } from './dto/create-audio-upload.dto';
import { UpdateAudioUploadDto } from './dto/update-audio-upload.dto';
import { UploadService } from '../../modules/upload/upload.service';
import * as mm from 'music-metadata';
import { MediaConverterService } from '../../modules/MediaConvert/media-converter.service';

@Injectable()
export class AudioUploadsService {
  constructor(
    @InjectRepository(AudioUpload)
    private readonly audioUploadRepo: Repository<AudioUpload>,
    private readonly uploadService: UploadService,
    private readonly mediaConverterService: MediaConverterService, 
  ) {}

  async create(createDto: CreateAudioUploadDto) {
    const newRecord = this.audioUploadRepo.create(createDto);
    return await this.audioUploadRepo.save(newRecord);
  }

  async findAll() {
    const records = await this.audioUploadRepo.find({ 
      relations: { storageObject: true } 
    });

    const recordsWithUrls = await Promise.all(records.map(async (record) => {
      let freshUrl: string | null = null; 
      if (record.storageObject && record.storageObject.objectKey) {
        freshUrl = await this.uploadService.getFileUrl(record.storageObject.objectKey);
      }

      return {
        ...record,
        url: freshUrl
      };
    }));

    return recordsWithUrls;
  }

  async findOne(id: number) {
    const record = await this.audioUploadRepo.findOne({ 
      where: { id }, 
      relations: { storageObject: true } 
    });
    
    if (!record) throw new NotFoundException(`Không tìm thấy dữ liệu ID = ${id}`);

    let freshUrl: string | null = null; 
    
    if (record.storageObject && record.storageObject.objectKey) {
      freshUrl = await this.uploadService.getFileUrl(record.storageObject.objectKey, record.storageObject.bucketName);
    }

    return {
      ...record,
      url: freshUrl
    };
  }

  async getAnalysis(id: number) {
    const audioUpload = await this.audioUploadRepo.findOne({
      where: { id },
      relations: {
        storageObject: true,
        audioUploadSpeakers: {
          speaker: {
            voiceSamples: {
              storageObject: true,
            },
          },
        },
        audioSegments: {
          segmentStorageObject: true,
        },
      },
    });

    if (!audioUpload) {
      throw new NotFoundException(`Không tìm thấy AudioUpload với ID = ${id}`);
    }

    let audioUrl: string | null = null;
    if (audioUpload.storageObject?.objectKey) {
      audioUrl = await this.uploadService.getFileUrl(
        audioUpload.storageObject.objectKey,
        audioUpload.storageObject.bucketName,
      );
    }

    const speakers = await Promise.all(
      (audioUpload.audioUploadSpeakers || []).map(async (aus) => {
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

    const audioSegments = await Promise.all(
      (audioUpload.audioSegments || []).map(async (segment) => {
        let segmentUrl: string | null = null;
        if (segment.segmentStorageObject?.objectKey) {
          segmentUrl = await this.uploadService.getFileUrl(
            segment.segmentStorageObject.objectKey,
            segment.segmentStorageObject.bucketName,
          );
        }
        return {
          ...segment,
          url: segmentUrl,
        };
      }),
    );

    return {
      success: true,
      audioUpload: {
        id: audioUpload.id,
        storageObjectId: audioUpload.storageObjectId,
        durationSeconds: audioUpload.durationSeconds,
        processingStatus: audioUpload.processingStatus,
        uploadedAt: audioUpload.uploadedAt,
        storageObject: audioUpload.storageObject,
        url: audioUrl,
      },
      speakersCount: speakers.length,
      speakers,
      audioSegmentsCount: audioSegments.length,
      audioSegments,
    };
  }

  async update(id: number, updateDto: UpdateAudioUploadDto) {
    const record = await this.findOne(id);
    Object.assign(record, updateDto);
    return await this.audioUploadRepo.save(record);
  }

  async remove(id: number) {
    const record = await this.findOne(id);
    await this.audioUploadRepo.remove(record);
    return { message: `Đã xóa thành công ID = ${id}` };
  }

  async uploadMeeting(file: Express.Multer.File) {
    try {
      console.log('\n[AUDIO UPLOAD] Đang bắt đầu quy trình upload meeting...');
      const wavFile = await this.mediaConverterService.convertToWav(file);

      let autoDuration = 0;
      try {
        console.log('[AUDIO UPLOAD] Đang phân tích metadata để lấy thời lượng file...');
        
        const metadata = await mm.parseBuffer(wavFile.buffer, wavFile.mimetype);
        
        if (metadata.format.duration) {
          autoDuration = Math.round(metadata.format.duration);
          console.log(`[AUDIO UPLOAD] Đã tính được thời lượng: ${autoDuration} giây`);
        } else {
          console.log('[AUDIO UPLOAD] Không tìm thấy thông tin thời lượng trong file này, set mặc định = 0');
        }
      } catch (metadataError: any) {
        console.warn(`[AUDIO UPLOAD] Lỗi đọc thời lượng: ${metadataError.message}`);
      }

      const uploadResult = await this.uploadService.uploadFile(wavFile);

      if (!uploadResult.success || !uploadResult.data) {
        throw new InternalServerErrorException('Lỗi: Không lấy được thông tin từ Storage Service');
      }

      const storageObjectId = uploadResult.data.id;
      console.log(`[AUDIO UPLOAD] Đã lấy được Storage Object ID: ${storageObjectId}`);
      console.log('[AUDIO UPLOAD] Đang tạo bản ghi mới trong bảng audio_uploads...');

      const newAudioRecord = this.audioUploadRepo.create({
        storageObject: { id: storageObjectId } as any, 
        durationSeconds: autoDuration, 
        processingStatus: 'PENDING',       
      });

      const savedAudioRecord = await this.audioUploadRepo.save(newAudioRecord);
      
      console.log('[AUDIO UPLOAD] Hoàn tất lưu dữ liệu meeting!');

      return {
        success: true,
        message: 'Upload và convert file sang WAV thành công!',
        data: savedAudioRecord,
        url: uploadResult.url 
      };

    } catch (error) {
      console.error('\n[AUDIO UPLOAD - LỖI]', error);
      throw new InternalServerErrorException('Có lỗi xảy ra trong quá trình tải lên Meeting');
    }
  }
}