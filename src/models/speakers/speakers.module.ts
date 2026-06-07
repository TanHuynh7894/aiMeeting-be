import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SpeakersService } from './speakers.service';
import { SpeakersController } from './speakers.controller';
import { Speaker } from './entities/speaker.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Speaker])], // Đăng ký Entity với TypeORM
  controllers: [SpeakersController],
  providers: [SpeakersService],
  exports: [SpeakersService], // Export ra ngoài nếu các module khác cần gọi tới gán khóa ngoại
})
export class SpeakersModule {}