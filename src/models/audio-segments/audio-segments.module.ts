import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AudioSegmentsService } from './audio-segments.service';
import { AudioSegmentsController } from './audio-segments.controller';
import { AudioSegment } from './entities/audio-segment.entity';
import { AudioUpload } from '../audio-uploads/entities/audio-upload.entity';
import { UploadModule } from '../../modules/upload/upload.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AudioSegment, AudioUpload]),
    UploadModule,
  ],
  controllers: [AudioSegmentsController],
  providers: [AudioSegmentsService],
  exports: [AudioSegmentsService],
})
export class AudioSegmentsModule { }