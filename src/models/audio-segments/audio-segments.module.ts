import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AudioSegmentsService } from './audio-segments.service';
import { AudioSegmentsController } from './audio-segments.controller';
import { AudioSegment } from './entities/audio-segment.entity';
import { AudioUpload } from '../audio-uploads/entities/audio-upload.entity';
import { Speaker } from '../speakers/entities/speaker.entity';
import { VoiceSample } from '../voice-samples/entities/voice-sample.entity';
import { AudioUploadSpeaker } from '../audio-upload-speakers/entities/audio-upload-speaker.entity';
import { UploadModule } from '../../modules/upload/upload.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AudioSegment, AudioUpload, Speaker, VoiceSample, AudioUploadSpeaker]),
    UploadModule,
  ],
  controllers: [AudioSegmentsController],
  providers: [AudioSegmentsService],
  exports: [AudioSegmentsService],
})
export class AudioSegmentsModule { }