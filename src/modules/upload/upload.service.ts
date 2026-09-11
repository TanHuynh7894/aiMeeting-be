import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';
import { StorageObjectsService } from '../../models/storage-objects/storage-objects.service';

@Injectable()
export class UploadService {
  private minioClient: Minio.Client;

  constructor(
    private configService: ConfigService,
    private storageObjectsService: StorageObjectsService
  ) {
    const endPoint = this.configService.get<string>('S3_ENDPOINT') || '';
    const port = parseInt(this.configService.get<string>('S3_PORT') || '9000', 10);

    // LOG KIỂM TRA LÚC KHỞI ĐỘNG APP
    console.log('\n[NAS SYSTEM] Đang khởi tạo Minio Client...');
    console.log(`- EndPoint kết nối: ${endPoint}`);
    console.log(`- Port: ${port}`);

    this.minioClient = new Minio.Client({
      endPoint: endPoint,
      port: port,
      useSSL: false,
      accessKey: this.configService.get<string>('S3_ACCESS_KEY') || '',
      secretKey: this.configService.get<string>('S3_SECRET_KEY') || '',
    });
  }

  async uploadFile(file: Express.Multer.File) {
    console.log('\n===================================================');
    console.log('[NAS UPLOAD - BƯỚC 1] Nhận yêu cầu upload file từ Client');
    console.log(`- Tên file gốc: ${file.originalname}`);
    console.log(`- Kích thước: ${file.size} bytes (~ ${(file.size / 1024 / 1024).toFixed(2)} MB)`);
    console.log(`- Mimetype: ${file.mimetype}`);

    const bucketName = this.configService.get<string>('S3_BUCKET') || 'meeting-pipeline';
    const fileName = `${Date.now()}-${file.originalname}`;

    try {
      console.log(`\n[NAS UPLOAD - BƯỚC 2] Chuẩn bị đẩy lên Bucket: [${bucketName}]`);
      console.log(`- Tên file lưu trên NAS: [${fileName}]`);

      console.log('\n[NAS UPLOAD - BƯỚC 3] Đang gọi API Minio (putObject) để truyền dữ liệu...');
      console.log('⏳ Vui lòng đợi trong giây lát... (Nếu bị kẹt lâu ở đây, có thể do mạng hoặc kích thước file)');

      await this.minioClient.putObject(
        bucketName,
        fileName,
        file.buffer,
        file.size,
        { 'Content-Type': file.mimetype }
      );

      console.log('\n[NAS UPLOAD - BƯỚC 4]  Đẩy dữ liệu lên NAS thành công! Đang tạo Presigned URL...');

      const expiryTime = 24 * 60 * 60;
      const presignedUrl = await this.minioClient.presignedGetObject(bucketName, fileName, expiryTime);

      console.log('\n[NAS UPLOAD - BƯỚC 5] Đang lưu thông tin vào Database...');

      const savedObject = await this.storageObjectsService.create({
        bucketName: bucketName,
        objectKey: fileName,
        originalFileName: file.originalname,
        mimeType: file.mimetype,
        fileSize: file.size,
      });

      console.log('\n[NAS UPLOAD - BƯỚC 6]  HOÀN TẤT TRỌN VẸN!');
      console.log('===================================================\n');

      return {
        success: true,
        message: 'Đã đẩy file lên NAS RustFS và lưu Database thành công!',
        data: savedObject,
        fileName: fileName,
        url: presignedUrl,
      };

    } catch (error: any) {
      console.error('\n[NAS UPLOAD - THẤT BẠI] Quá trình upload bị đứt gãy!');
      console.error('- Loại lỗi (Name):', error.name);
      console.error('- Mã lỗi (Code):', error.code);
      console.error('- Lời nhắn (Message):', error.message);

      if (error.code === 'ECONNRESET') {
        console.error('\n CHUẨN ĐOÁN ĐẶC BIỆT (ECONNRESET): NAS hoặc mạng đã chủ động ngắt kết nối.');
        console.error(' Khả năng 1: Do bạn đang đẩy file trực tiếp bằng `file.buffer` (đẩy toàn bộ 1 cục to vào mạng), NAS không kịp nuốt nên nó ngắt.');
        console.error(' Khả năng 2: Bạn khai báo S3_ENDPOINT bị sai (có chứa chữ http:// ở trong biến môi trường không? S3_ENDPOINT chỉ nhận IP hoặc Domain trần).');
        console.error(' Khả năng 3: Port 9000 trên NAS đang bị tường lửa chặn.');
      }

      console.log('===================================================\n');
      throw new InternalServerErrorException('Lỗi hệ thống khi lưu trữ file');
    }
  }

  async getFileUrl(fileName: string): Promise<string | null> {
    try {
      const bucketName = this.configService.get<string>('S3_BUCKET') || 'meeting-pipeline';
      const expiryTime = 24 * 60 * 60;
      return await this.minioClient.presignedGetObject(bucketName, fileName, expiryTime);
    } catch (error: any) {
      console.error(`[NAS] Lỗi khi tạo link cho file ${fileName}:`, error.message);
      return null;
    }
  }
}