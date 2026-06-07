import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transcript } from './entities/transcript.entity';
import { CreateTranscriptDto } from './dto/create-transcript.dto';
import { UpdateTranscriptDto } from './dto/update-transcript.dto';

@Injectable()
export class TranscriptsService {
  constructor(
    @InjectRepository(Transcript)
    private readonly transcriptRepo: Repository<Transcript>,
  ) {}

  async create(createDto: CreateTranscriptDto) {
    const newRecord = this.transcriptRepo.create(createDto);
    return await this.transcriptRepo.save(newRecord);
  }

  async findAll() {
    return await this.transcriptRepo.find({ 
      relations: { audioUpload: true, audioSegment: true, transcriptStorageObject: true } 
    });
  }

  async findOne(id: number) {
    const record = await this.transcriptRepo.findOne({ 
      where: { id }, 
      relations: { audioUpload: true, audioSegment: true, transcriptStorageObject: true } 
    });
    if (!record) throw new NotFoundException(`Không tìm thấy dữ liệu ID = ${id}`);
    return record;
  }

  async update(id: number, updateDto: UpdateTranscriptDto) {
    const record = await this.findOne(id);
    Object.assign(record, updateDto);
    return await this.transcriptRepo.save(record);
  }

  async remove(id: number) {
    const record = await this.findOne(id);
    await this.transcriptRepo.remove(record);
    return { message: `Đã xóa thành công ID = ${id}` };
  }
}