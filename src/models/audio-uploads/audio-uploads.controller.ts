import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AudioUploadsService } from './audio-uploads.service';
import { CreateAudioUploadDto } from './dto/create-audio-upload.dto';
import { UpdateAudioUploadDto } from './dto/update-audio-upload.dto';

@ApiTags('Audio Uploads')
@Controller('audio-uploads')
export class AudioUploadsController {
  constructor(private readonly audioUploadsService: AudioUploadsService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo mới Audio Upload' })
  create(@Body() createAudioUploadDto: CreateAudioUploadDto) {
    return this.audioUploadsService.create(createAudioUploadDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách Audio Uploads' })
  findAll() {
    return this.audioUploadsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết Audio Upload' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.audioUploadsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật Audio Upload' })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateAudioUploadDto: UpdateAudioUploadDto) {
    return this.audioUploadsService.update(id, updateAudioUploadDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa Audio Upload' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.audioUploadsService.remove(id);
  }
}