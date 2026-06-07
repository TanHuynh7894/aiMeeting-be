import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MeetingMinutesService } from './meeting-minutes.service';
import { MeetingMinutesController } from './meeting-minutes.controller';
import { MeetingMinute } from './entities/meeting-minute.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MeetingMinute])],
  controllers: [MeetingMinutesController],
  providers: [MeetingMinutesService],
  exports: [MeetingMinutesService],
})
export class MeetingMinutesModule {}