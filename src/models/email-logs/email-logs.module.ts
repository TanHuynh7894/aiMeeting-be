import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailLogsService } from './email-logs.service';
import { EmailLogsController } from './email-logs.controller';
import { EmailLog } from './entities/email-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([EmailLog])],
  controllers: [EmailLogsController],
  providers: [EmailLogsService],
  exports: [EmailLogsService],
})
export class EmailLogsModule {}