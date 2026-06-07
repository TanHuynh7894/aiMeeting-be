import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MeetingMinute } from './entities/meeting-minute.entity';
import { CreateMeetingMinuteDto } from './dto/create-meeting-minute.dto';
import { UpdateMeetingMinuteDto } from './dto/update-meeting-minute.dto';

@Injectable()
export class MeetingMinutesService {
  constructor(
    @InjectRepository(MeetingMinute)
    private readonly meetingMinuteRepo: Repository<MeetingMinute>,
  ) {}

  async create(createDto: CreateMeetingMinuteDto) {
    const newRecord = this.meetingMinuteRepo.create(createDto);
    return await this.meetingMinuteRepo.save(newRecord);
  }

  async findAll() {
    return await this.meetingMinuteRepo.find({ 
      relations: { audioUpload: true, pdfStorageObject: true, docxStorageObject: true } 
    });
  }

  async findOne(id: number) {
    const record = await this.meetingMinuteRepo.findOne({ 
      where: { id }, 
      relations: { audioUpload: true, pdfStorageObject: true, docxStorageObject: true } 
    });
    if (!record) throw new NotFoundException(`Không tìm thấy dữ liệu ID = ${id}`);
    return record;
  }

  async update(id: number, updateDto: UpdateMeetingMinuteDto) {
    const record = await this.findOne(id);
    Object.assign(record, updateDto);
    return await this.meetingMinuteRepo.save(record);
  }

  async remove(id: number) {
    const record = await this.findOne(id);
    await this.meetingMinuteRepo.remove(record);
    return { message: `Đã xóa thành công ID = ${id}` };
  }
}