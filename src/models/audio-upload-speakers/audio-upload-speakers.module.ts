import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AudioUploadSpeaker } from './entities/audio-upload-speaker.entity';
import { AudioUpload } from '../audio-uploads/entities/audio-upload.entity';
import { Speaker } from '../speakers/entities/speaker.entity';
import { AudioUploadSpeakersService } from './audio-upload-speakers.service';
import { AudioUploadSpeakersController } from './audio-upload-speakers.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([AudioUploadSpeaker, AudioUpload, Speaker]),
  ],
  controllers: [AudioUploadSpeakersController],
  providers: [AudioUploadSpeakersService],
  exports: [AudioUploadSpeakersService],
})
export class AudioUploadSpeakersModule {}
