import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AudioSegment } from './entities/audio-segment.entity';
import { CreateAudioSegmentDto } from './dto/create-audio-segment.dto';
import { UpdateAudioSegmentDto } from './dto/update-audio-segment.dto';

@Injectable()
export class AudioSegmentsService {
  constructor(
    @InjectRepository(AudioSegment)
    private readonly audioSegmentRepo: Repository<AudioSegment>,
  ) {}

  async create(createDto: CreateAudioSegmentDto) {
    const newRecord = this.audioSegmentRepo.create(createDto);
    return await this.audioSegmentRepo.save(newRecord);
  }

  async findAll() {
    return await this.audioSegmentRepo.find({ 
      relations: { audioUpload: true, segmentStorageObject: true } 
    });
  }

  async findOne(id: number) {
    const record = await this.audioSegmentRepo.findOne({ 
      where: { id }, 
      relations: { audioUpload: true, segmentStorageObject: true } 
    });
    if (!record) throw new NotFoundException(`Không tìm thấy dữ liệu ID = ${id}`);
    return record;
  }

  async update(id: number, updateDto: UpdateAudioSegmentDto) {
    const record = await this.findOne(id);
    Object.assign(record, updateDto);
    return await this.audioSegmentRepo.save(record);
  }

  async remove(id: number) {
    const record = await this.findOne(id);
    await this.audioSegmentRepo.remove(record);
    return { message: `Đã xóa thành công ID = ${id}` };
  }
}