import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AudioUploadSpeaker } from './entities/audio-upload-speaker.entity';
import { AudioUpload } from '../audio-uploads/entities/audio-upload.entity';
import { Speaker } from '../speakers/entities/speaker.entity';
import { CreateAudioUploadSpeakerDto } from './dto/create-audio-upload-speaker.dto';

@Injectable()
export class AudioUploadSpeakersService {
  constructor(
    @InjectRepository(AudioUploadSpeaker)
    private readonly ausRepo: Repository<AudioUploadSpeaker>,
    @InjectRepository(AudioUpload)
    private readonly audioUploadRepo: Repository<AudioUpload>,
    @InjectRepository(Speaker)
    private readonly speakerRepo: Repository<Speaker>,
  ) {}

  async addSpeakerToAudioUpload(dto: CreateAudioUploadSpeakerDto) {
    const { audioUploadId, speakerId } = dto;

    const audioUploadExists = await this.audioUploadRepo.findOneBy({ id: audioUploadId });
    if (!audioUploadExists) {
      throw new NotFoundException(`Không tìm thấy AudioUpload ID = ${audioUploadId}`);
    }

    const speakerExists = await this.speakerRepo.findOneBy({ id: speakerId });
    if (!speakerExists) {
      throw new NotFoundException(`Không tìm thấy Speaker ID = ${speakerId}`);
    }

    const existing = await this.ausRepo.findOneBy({ audioUploadId, speakerId });
    if (existing) {
      throw new ConflictException(`Speaker ID = ${speakerId} đã được gắn vào AudioUpload ID = ${audioUploadId}`);
    }

    const record = this.ausRepo.create({
      audioUploadId,
      speakerId,
    });

    return await this.ausRepo.save(record);
  }

  async findAll() {
    return await this.ausRepo.find({
      relations: { audioUpload: true, speaker: true },
    });
  }

  async findByAudioUploadId(audioUploadId: number) {
    return await this.ausRepo.find({
      where: { audioUploadId },
      relations: { speaker: true },
    });
  }

  async findBySpeakerId(speakerId: number) {
    return await this.ausRepo.find({
      where: { speakerId },
      relations: { audioUpload: true },
    });
  }

  async removeSpeakerFromAudioUpload(audioUploadId: number, speakerId: number) {
    const record = await this.ausRepo.findOneBy({ audioUploadId, speakerId });
    if (!record) {
      throw new NotFoundException(`Không tìm thấy liên kết giữa AudioUpload ID = ${audioUploadId} và Speaker ID = ${speakerId}`);
    }

    await this.ausRepo.remove(record);
    return { message: `Đã xóa liên kết giữa AudioUpload ID = ${audioUploadId} và Speaker ID = ${speakerId}` };
  }
}
