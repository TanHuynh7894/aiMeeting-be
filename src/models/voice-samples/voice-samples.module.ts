import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VoiceSamplesService } from './voice-samples.service';
import { VoiceSamplesController } from './voice-samples.controller';
import { VoiceSample } from './entities/voice-sample.entity';

@Module({
  imports: [TypeOrmModule.forFeature([VoiceSample])],
  controllers: [VoiceSamplesController],
  providers: [VoiceSamplesService],
  exports: [VoiceSamplesService],
})
export class VoiceSamplesModule {}