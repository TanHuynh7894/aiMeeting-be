import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
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
  ) {}

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
    const fileUrl = await this.uploadService.getFileUrl(audioUpload.storageObject.objectKey);

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

  // 2. Nhận 1 file segment được cắt ra -> lưu vào Storage Service -> lưu DB audio_segments
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

    // Lưu file vào NAS qua UploadService
    const uploadResult = await this.uploadService.uploadFile(file);

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
    return await this.audioSegmentRepo.find({
      relations: { audioUpload: true, segmentStorageObject: true },
    });
  }

  async findOne(id: number) {
    const record = await this.audioSegmentRepo.findOne({
      where: { id },
      relations: { audioUpload: true, segmentStorageObject: true },
    });
    if (!record) throw new NotFoundException(`Không tìm thấy dữ liệu ID = ${id}`);
    return record;
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
}