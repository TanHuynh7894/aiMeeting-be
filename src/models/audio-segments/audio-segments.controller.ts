import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AudioSegmentsService } from './audio-segments.service';
import { CreateAudioSegmentDto } from './dto/create-audio-segment.dto';
import { UpdateAudioSegmentDto } from './dto/update-audio-segment.dto';

@ApiTags('Audio Segments')
@Controller('audio-segments')
export class AudioSegmentsController {
  constructor(private readonly audioSegmentsService: AudioSegmentsService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo mới Audio Segment' })
  create(@Body() createAudioSegmentDto: CreateAudioSegmentDto) {
    return this.audioSegmentsService.create(createAudioSegmentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách Audio Segments' })
  findAll() {
    return this.audioSegmentsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết Audio Segment' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.audioSegmentsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật Audio Segment' })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateAudioSegmentDto: UpdateAudioSegmentDto) {
    return this.audioSegmentsService.update(id, updateAudioSegmentDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa Audio Segment' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.audioSegmentsService.remove(id);
  }
}