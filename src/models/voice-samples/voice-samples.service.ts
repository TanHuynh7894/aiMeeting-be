import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VoiceSample } from './entities/voice-sample.entity';
import { CreateVoiceSampleDto } from './dto/create-voice-sample.dto';
import { UpdateVoiceSampleDto } from './dto/update-voice-sample.dto';

@Injectable()
export class VoiceSamplesService {
  constructor(
    @InjectRepository(VoiceSample)
    private readonly voiceSampleRepo: Repository<VoiceSample>,
  ) {}

  async create(createDto: CreateVoiceSampleDto) {
    const newRecord = this.voiceSampleRepo.create(createDto);
    return await this.voiceSampleRepo.save(newRecord);
  }

  async findAll() {
    return await this.voiceSampleRepo.find({ 
      relations: { speaker: true, storageObject: true, embeddingObject: true } 
    });
  }

  async findOne(id: number) {
    const record = await this.voiceSampleRepo.findOne({ 
      where: { id }, 
      relations: { speaker: true, storageObject: true, embeddingObject: true } 
    });
    if (!record) throw new NotFoundException(`Không tìm thấy dữ liệu ID = ${id}`);
    return record;
  }

  async update(id: number, updateDto: UpdateVoiceSampleDto) {
    const record = await this.findOne(id);
    Object.assign(record, updateDto);
    return await this.voiceSampleRepo.save(record);
  }

  async remove(id: number) {
    const record = await this.findOne(id);
    await this.voiceSampleRepo.remove(record);
    return { message: `Đã xóa thành công ID = ${id}` };
  }
}