import { Module } from '@nestjs/common';
import { UploadService } from './upload.service';
import { StorageObjectsModule } from '../../models/storage-objects/storage-objects.module'; 

@Module({
  imports: [StorageObjectsModule], 
  providers: [UploadService],
  exports: [UploadService],
})
export class UploadModule {}