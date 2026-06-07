import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AudioUploadsService } from './audio-uploads.service';
import { AudioUploadsController } from './audio-uploads.controller';
import { AudioUpload } from './entities/audio-upload.entity';
import { UploadModule } from '../../modules/upload/upload.module'; 
import { MediaConverterModule } from '../../modules/MediaConvert/media-converter.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AudioUpload]),
    UploadModule, 
    MediaConverterModule,
  ],
  controllers: [AudioUploadsController],
  providers: [AudioUploadsService],
})
export class AudioUploadsModule {}