import { Injectable, InternalServerErrorException } from '@nestjs/common';
// ĐÃ FIX LỖI IMPORT Ở DÒNG DƯỚI NÀY
import ffmpeg = require('fluent-ffmpeg'); 
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

@Injectable()
export class MediaConverterService {
  
  async convertToWav(file: Express.Multer.File): Promise<Express.Multer.File> {
    console.log('\n[CONVERTER] 🔄 Bắt đầu quá trình convert sang .WAV...');
    
    // Tạo đường dẫn file tạm thời trong thư mục Temp của hệ điều hành
    const tempInputPath = path.join(os.tmpdir(), `input-${Date.now()}-${file.originalname}`);
    const tempOutputPath = path.join(os.tmpdir(), `output-${Date.now()}.wav`);

    try {
      // 1. Lưu cục Buffer của file gốc thành file thật trên ổ cứng để FFmpeg đọc
      await fs.writeFile(tempInputPath, file.buffer);
      console.log(`[CONVERTER] ⏳ Đang nén và chuyển đổi định dạng (có thể mất vài giây với Video nặng)...`);

      // 2. Gọi FFmpeg để convert
      await new Promise((resolve, reject) => {
        ffmpeg(tempInputPath)
          .toFormat('wav')
          .audioChannels(1) // Đưa về Mono (1 channel) để file nhẹ hơn và AI dễ nhận diện giọng nói
          .audioFrequency(16000) // Đưa về tần số 16kHz (Chuẩn tối ưu cho Speech-to-Text)
          .on('end', () => resolve(true))
          .on('error', (err: any) => {
            console.error('[CONVERTER - LỖI FFmpeg]:', err.message);
            reject(err);
          })
          .save(tempOutputPath);
      });

      // 3. Đọc file .WAV vừa tạo ra thành cục Buffer mới
      const wavBuffer = await fs.readFile(tempOutputPath);

      // 4. Xóa rác (Xóa 2 file tạm để giải phóng ổ cứng)
      await fs.unlink(tempInputPath).catch(() => {});
      await fs.unlink(tempOutputPath).catch(() => {});

      // Lấy tên file gốc bỏ đuôi cũ (vd: video.mp4 -> video)
      const baseName = file.originalname.substring(0, file.originalname.lastIndexOf('.'));

      console.log('[CONVERTER] ✅ Convert thành công! File đã sẵn sàng.');

      // 5. Trả về một Object "đóng giả" Express.Multer.File với dữ liệu mới
      return {
        ...file,
        originalname: `${baseName}.wav`,
        mimetype: 'audio/wav',
        buffer: wavBuffer,
        size: wavBuffer.length,
      };

    } catch (error) {
      // Xóa file tạm nếu giữa chừng bị lỗi
      await fs.unlink(tempInputPath).catch(() => {});
      await fs.unlink(tempOutputPath).catch(() => {});
      throw new InternalServerErrorException('Lỗi hệ thống khi convert file sang định dạng WAV');
    }
  }
}