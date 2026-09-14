import { Controller, Get, Post, Delete, Body, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AudioUploadSpeakersService } from './audio-upload-speakers.service';
import { CreateAudioUploadSpeakerDto } from './dto/create-audio-upload-speaker.dto';

@ApiTags('Audio Upload Speakers')
@Controller('audio-upload-speakers')
export class AudioUploadSpeakersController {
  constructor(private readonly ausService: AudioUploadSpeakersService) {}

  @Post()
  @ApiOperation({ summary: 'Gán Speaker vào AudioUpload' })
  addSpeakerToAudioUpload(@Body() dto: CreateAudioUploadSpeakerDto) {
    return this.ausService.addSpeakerToAudioUpload(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy tất cả liên kết AudioUpload - Speaker' })
  findAll() {
    return this.ausService.findAll();
  }

  @Get('audio-upload/:audioUploadId')
  @ApiOperation({ summary: 'Lấy danh sách Speakers của 1 AudioUpload theo ID' })
  findByAudioUploadId(@Param('audioUploadId', ParseIntPipe) audioUploadId: number) {
    return this.ausService.findByAudioUploadId(audioUploadId);
  }

  @Get('speaker/:speakerId')
  @ApiOperation({ summary: 'Lấy danh sách AudioUploads của 1 Speaker theo ID' })
  findBySpeakerId(@Param('speakerId', ParseIntPipe) speakerId: number) {
    return this.ausService.findBySpeakerId(speakerId);
  }

  @Delete(':audioUploadId/:speakerId')
  @ApiOperation({ summary: 'Xóa liên kết giữa AudioUpload và Speaker' })
  removeSpeakerFromAudioUpload(
    @Param('audioUploadId', ParseIntPipe) audioUploadId: number,
    @Param('speakerId', ParseIntPipe) speakerId: number,
  ) {
    return this.ausService.removeSpeakerFromAudioUpload(audioUploadId, speakerId);
  }
}
