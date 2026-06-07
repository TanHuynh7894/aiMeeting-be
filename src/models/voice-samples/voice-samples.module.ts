import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VoiceSamplesService } from './voice-samples.service';
import { VoiceSamplesController } from './voice-samples.controller';
import { VoiceSample } from './entities/voice-sample.entity';
import { UploadModule } from '../../modules/upload/upload.module'; 
import { MediaConverterModule } from '../../modules/MediaConvert/media-converter.module'; 

@Module({
  imports: [
    TypeOrmModule.forFeature([VoiceSample]),
    UploadModule,
    MediaConverterModule,   
  ],
  controllers: [VoiceSamplesController],
  providers: [VoiceSamplesService],
})
export class VoiceSamplesModule {}