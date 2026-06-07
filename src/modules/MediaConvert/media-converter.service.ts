import { Injectable, InternalServerErrorException } from '@nestjs/common';
import ffmpeg = require('fluent-ffmpeg'); 
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class MediaConverterService {
  
  async convertToWav(file: Express.Multer.File): Promise<Express.Multer.File> {
    console.log('\n[CONVERTER] 🔄 Bắt đầu quá trình convert sang .WAV...');
    
    // 1. Tạo thư mục temp ngay tại thư mục gốc của dự án thay vì dùng Temp của hệ điều hành
    const tempDir = path.join(process.cwd(), 'temp');
    await fs.mkdir(tempDir, { recursive: true });

    // 2. CHUẨN HÓA ĐƯỜNG DẪN: Đổi toàn bộ dấu \ thành / để tránh lỗi kí tự escape trên Windows
    const tempInputPath = path.join(tempDir, `input-${Date.now()}-${file.originalname}`).replace(/\\/g, '/');
    const tempOutputPath = path.join(tempDir, `output-${Date.now()}.wav`).replace(/\\/g, '/');

    try {
      // Lưu cục Buffer của file gốc thành file thật trên ổ cứng để FFmpeg đọc
      await fs.writeFile(tempInputPath, file.buffer);
      console.log(`[CONVERTER] ⏳ Đang bóc tách audio và chuyển đổi định dạng bằng FFmpeg...`);

      // 3. Gọi FFmpeg xử lý với đường dẫn đã được chuẩn hóa tuyệt đối
      await new Promise((resolve, reject) => {
        ffmpeg(tempInputPath)
          .outputOptions('-y')      // Ép ghi đè file output nếu đã tồn tại
          .noVideo()                // Loại bỏ hoàn toàn luồng hình ảnh video, chỉ lấy tiếng
          .toFormat('wav')          // Ép định dạng vỏ bọc là WAV
          .audioCodec('pcm_s16le')  // Ép định dạng lõi âm thanh PCM 16-bit cực chuẩn cho WAV
          .audioChannels(1)         // Đưa về Mono (1 channel) giúp file nhẹ và tối ưu cho AI
          .audioFrequency(16000)    // Đặt tần số lấy mẫu 16kHz (Chuẩn vàng cho Speech-to-Text)
          .on('end', () => {
            console.log('[CONVERTER] FFmpeg đã hoàn tất xử lý file thành công.');
            resolve(true);
          })
          .on('error', (err: any) => {
            console.error('[CONVERTER - LỖI FFmpeg]:', err.message);
            reject(err);
          })
          .save(tempOutputPath);
      });

      // 4. Đọc file .WAV kết quả thành cục Buffer mới
      const wavBuffer = await fs.readFile(tempOutputPath);

      // 5. Xóa ngay lập tức 2 file tạm để giải phóng không gian ổ cứng
      await fs.unlink(tempInputPath).catch(() => {});
      await fs.unlink(tempOutputPath).catch(() => {});

      // Lấy tên file gốc loại bỏ đuôi cũ
      const baseName = file.originalname.substring(0, file.originalname.lastIndexOf('.'));

      console.log('[CONVERTER] ✅ Convert thành công! File đã sẵn sàng đẩy lên NAS.');

      // 6. Trả về Object file mới với dữ liệu đã được làm sạch
      return {
        ...file,
        originalname: `${baseName}.wav`,
        mimetype: 'audio/wav',
        buffer: wavBuffer,
        size: wavBuffer.length,
      };

    } catch (error) {
      // Đảm bảo dọn dẹp file tạm nếu chẳng may xảy ra lỗi ở giữa quy trình
      await fs.unlink(tempInputPath).catch(() => {});
      await fs.unlink(tempOutputPath).catch(() => {});
      console.error('[CONVERTER CRASH]:', error);
      throw new InternalServerErrorException('Lỗi hệ thống khi convert file sang định dạng WAV');
    }
  }
}