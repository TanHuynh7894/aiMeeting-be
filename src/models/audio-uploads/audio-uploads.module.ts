import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AudioUploadsService } from './audio-uploads.service';
import { AudioUploadsController } from './audio-uploads.controller';
import { AudioUpload } from './entities/audio-upload.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AudioUpload])],
  controllers: [AudioUploadsController],
  providers: [AudioUploadsService],
  exports: [AudioUploadsService],
})
export class AudioUploadsModule {}