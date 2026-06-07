import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Speaker } from './entities/speaker.entity';
import { CreateSpeakerDto } from './dto/create-speaker.dto';
import { UpdateSpeakerDto } from './dto/update-speaker.dto';

@Injectable()
export class SpeakersService {
  constructor(
    @InjectRepository(Speaker)
    private readonly speakerRepository: Repository<Speaker>, // Inject Repository chuẩn của TypeORM
  ) {}

  async create(createSpeakerDto: CreateSpeakerDto): Promise<Speaker> {
    const newSpeaker = this.speakerRepository.create(createSpeakerDto);
    return await this.speakerRepository.save(newSpeaker);
  }

  async findAll(): Promise<Speaker[]> {
    return await this.speakerRepository.find();
  }

  async findOne(id: number): Promise<Speaker> {
    const speaker = await this.speakerRepository.findOneBy({ id });
    if (!speaker) {
      throw new NotFoundException(`Không tìm thấy Speaker với ID = ${id}`);
    }
    return speaker;
  }

  async update(id: number, updateSpeakerDto: UpdateSpeakerDto): Promise<Speaker> {
    const speaker = await this.findOne(id);
    Object.assign(speaker, updateSpeakerDto); // Gộp các trường thay đổi vào đối tượng cũ
    return await this.speakerRepository.save(speaker);
  }

  async remove(id: number): Promise<{ message: string }> {
    const speaker = await this.findOne(id);
    await this.speakerRepository.remove(speaker);
    return { message: `Đã xóa thành công Speaker với ID = ${id}` };
  }
}