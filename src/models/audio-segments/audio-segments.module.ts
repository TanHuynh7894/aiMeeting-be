import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AudioSegmentsService } from './audio-segments.service';
import { AudioSegmentsController } from './audio-segments.controller';
import { AudioSegment } from './entities/audio-segment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AudioSegment])],
  controllers: [AudioSegmentsController],
  providers: [AudioSegmentsService],
  exports: [AudioSegmentsService],
})
export class AudioSegmentsModule {}