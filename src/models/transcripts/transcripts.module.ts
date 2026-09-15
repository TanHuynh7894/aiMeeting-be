import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TranscriptsService } from './transcripts.service';
import { TranscriptsController } from './transcripts.controller';
import { Transcript } from './entities/transcript.entity';
import { AudioSegment } from '../audio-segments/entities/audio-segment.entity';
import { AudioUpload } from '../audio-uploads/entities/audio-upload.entity';
import { UploadModule } from '../../modules/upload/upload.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Transcript, AudioSegment, AudioUpload]),
    UploadModule,
  ],
  controllers: [TranscriptsController],
  providers: [TranscriptsService],
  exports: [TranscriptsService],
})
export class TranscriptsModule {}