import { Module } from '@nestjs/common';
import { MediaConverterService } from './media-converter.service';

@Module({
  providers: [MediaConverterService],
  exports: [MediaConverterService], // Xuất ra để AudioUploadsModule dùng
})
export class MediaConverterModule {}