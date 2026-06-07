import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AudioUpload } from './entities/audio-upload.entity';
import { CreateAudioUploadDto } from './dto/create-audio-upload.dto';
import { UpdateAudioUploadDto } from './dto/update-audio-upload.dto';

@Injectable()
export class AudioUploadsService {
  constructor(
    @InjectRepository(AudioUpload)
    private readonly audioUploadRepo: Repository<AudioUpload>,
  ) {}

  async create(createDto: CreateAudioUploadDto) {
    const newRecord = this.audioUploadRepo.create(createDto);
    return await this.audioUploadRepo.save(newRecord);
  }

  async findAll() {
    return await this.audioUploadRepo.find({ 
      relations: { storageObject: true } 
    });
  }

  async findOne(id: number) {
    const record = await this.audioUploadRepo.findOne({ 
      where: { id }, 
      relations: { storageObject: true } 
    });
    if (!record) throw new NotFoundException(`Không tìm thấy dữ liệu ID = ${id}`);
    return record;
  }

  async update(id: number, updateDto: UpdateAudioUploadDto) {
    const record = await this.findOne(id);
    Object.assign(record, updateDto);
    return await this.audioUploadRepo.save(record);
  }

  async remove(id: number) {
    const record = await this.findOne(id);
    await this.audioUploadRepo.remove(record);
    return { message: `Đã xóa thành công ID = ${id}` };
  }
}