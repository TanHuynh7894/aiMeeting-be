import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AudioUpload } from './entities/audio-upload.entity';
import { CreateAudioUploadDto } from './dto/create-audio-upload.dto';
import { UpdateAudioUploadDto } from './dto/update-audio-upload.dto';
import { UploadService } from '../../modules/upload/upload.service'; // Nhớ check lại đường dẫn import này
import * as mm from 'music-metadata';

// 1. IMPORT SERVICE CONVERT VÀO ĐÂY
import { MediaConverterService } from '../../modules/MediaConvert/media-converter.service'; // Cập nhật lại đường dẫn cho đúng với project của bạn

@Injectable()
export class AudioUploadsService {
  constructor(
    @InjectRepository(AudioUpload)
    private readonly audioUploadRepo: Repository<AudioUpload>,
    private readonly uploadService: UploadService,
    // 2. INJECT VÀO ĐÂY ĐỂ SỬ DỤNG
    private readonly mediaConverterService: MediaConverterService, 
  ) {}

  // =====================================================================
  // CÁC HÀM CRUD MẶC ĐỊNH
  // =====================================================================
  async create(createDto: CreateAudioUploadDto) {
    const newRecord = this.audioUploadRepo.create(createDto);
    return await this.audioUploadRepo.save(newRecord);
  }

  async findAll() {
    // 1. Lấy toàn bộ data từ Database lên
    const records = await this.audioUploadRepo.find({ 
      relations: { storageObject: true } 
    });

    // 2. Chạy vòng lặp để tạo link trực tiếp cho từng bản ghi
    const recordsWithUrls = await Promise.all(records.map(async (record) => {
      // ĐÃ FIX LỖI ÉP KIỂU TẠI ĐÂY
      let freshUrl: string | null = null; 
      
      // Kiểm tra xem record này có file lưu trong bảng storage_objects không
      if (record.storageObject && record.storageObject.objectKey) {
        // Gọi sang UploadService để xin 1 cái link mới sống 24h
        freshUrl = await this.uploadService.getFileUrl(record.storageObject.objectKey);
      }

      // Trả về object cũ và đính kèm thêm field "url" ra bên ngoài cho Frontend dễ lấy
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

    // ĐÃ FIX LỖI ÉP KIỂU TẠI ĐÂY
    let freshUrl: string | null = null; 
    
    if (record.storageObject && record.storageObject.objectKey) {
      freshUrl = await this.uploadService.getFileUrl(record.storageObject.objectKey);
    }

    return {
      ...record,
      url: freshUrl
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

  // =====================================================================
  // HÀM UPLOAD FILE, CONVERT SANG WAV VÀ TỰ ĐỘNG LẤY THỜI LƯỢNG
  // =====================================================================
  async uploadMeeting(file: Express.Multer.File) {
    try {
      console.log('\n[AUDIO UPLOAD] Đang bắt đầu quy trình upload meeting...');

      // 🌟 BƯỚC MỚI: CONVERT MỌI ĐỊNH DẠNG SANG .WAV
      // Từ đây trở đi, chúng ta sẽ dùng wavFile thay thế cho file gốc ban đầu
      const wavFile = await this.mediaConverterService.convertToWav(file);

      // 1. Tự động đọc số giây từ file WAV (Bây giờ chắc chắn sẽ đọc được 100%)
      let autoDuration = 0;
      try {
        console.log('[AUDIO UPLOAD] Đang phân tích metadata để lấy thời lượng file...');
        
        // CHÚ Ý: Dùng wavFile.buffer thay vì file.buffer
        const metadata = await mm.parseBuffer(wavFile.buffer, wavFile.mimetype);
        
        if (metadata.format.duration) {
          autoDuration = Math.round(metadata.format.duration);
          console.log(`[AUDIO UPLOAD] ⏱️ Đã tính được thời lượng: ${autoDuration} giây`);
        } else {
          console.log('[AUDIO UPLOAD] ⚠️ Không tìm thấy thông tin thời lượng trong file này, set mặc định = 0');
        }
      } catch (metadataError: any) {
        console.warn(`[AUDIO UPLOAD] ⚠️ Lỗi đọc thời lượng: ${metadataError.message}`);
      }

      // 2. Đẩy file WAV lên NAS
      // CHÚ Ý: Dùng wavFile ở đây để đẩy file đã convert lên MinIO
      const uploadResult = await this.uploadService.uploadFile(wavFile);

      if (!uploadResult.success || !uploadResult.data) {
        throw new InternalServerErrorException('Lỗi: Không lấy được thông tin từ Storage Service');
      }

      const storageObjectId = uploadResult.data.id;
      console.log(`[AUDIO UPLOAD] Đã lấy được Storage Object ID: ${storageObjectId}`);
      console.log('[AUDIO UPLOAD] Đang tạo bản ghi mới trong bảng audio_uploads...');

      // 3. Lưu vào Database
      const newAudioRecord = this.audioUploadRepo.create({
        storageObject: { id: storageObjectId } as any, 
        durationSeconds: autoDuration, 
        processingStatus: 'PENDING',       
      });

      const savedAudioRecord = await this.audioUploadRepo.save(newAudioRecord);
      
      console.log('[AUDIO UPLOAD] 🎉 Hoàn tất lưu dữ liệu meeting!');

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