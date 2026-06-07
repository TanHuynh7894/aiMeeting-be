import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailLog } from './entities/email-log.entity';
import { CreateEmailLogDto } from './dto/create-email-log.dto';
import { UpdateEmailLogDto } from './dto/update-email-log.dto';

@Injectable()
export class EmailLogsService {
  constructor(
    @InjectRepository(EmailLog)
    private readonly emailLogRepo: Repository<EmailLog>,
  ) {}

  async create(createDto: CreateEmailLogDto) {
    const newRecord = this.emailLogRepo.create(createDto);
    return await this.emailLogRepo.save(newRecord);
  }

  async findAll() {
    return await this.emailLogRepo.find({ 
      relations: { meetingMinute: true } 
    });
  }

  async findOne(id: number) {
    const record = await this.emailLogRepo.findOne({ 
      where: { id }, 
      relations: { meetingMinute: true } 
    });
    if (!record) throw new NotFoundException(`Không tìm thấy dữ liệu ID = ${id}`);
    return record;
  }

  async update(id: number, updateDto: UpdateEmailLogDto) {
    const record = await this.findOne(id);
    Object.assign(record, updateDto);
    return await this.emailLogRepo.save(record);
  }

  async remove(id: number) {
    const record = await this.findOne(id);
    await this.emailLogRepo.remove(record);
    return { message: `Đã xóa thành công ID = ${id}` };
  }
}