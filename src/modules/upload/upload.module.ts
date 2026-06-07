// file: upload.module.ts
import { Module } from '@nestjs/common';
import { UploadService } from './upload.service';
import { UploadController } from './upload.controller';
// IMPORT MODULE BẠN VỪA EXPORT Ở BƯỚC 1 VÀO ĐÂY
import { StorageObjectsModule } from '../../models/storage-objects/storage-objects.module'; 

@Module({
  // THÊM NÓ VÀO MẢNG IMPORTS
  imports: [StorageObjectsModule], 
  controllers: [UploadController],
  providers: [UploadService],
})
export class UploadModule {}