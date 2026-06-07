import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { TranscriptsService } from './transcripts.service';
import { CreateTranscriptDto } from './dto/create-transcript.dto';
import { UpdateTranscriptDto } from './dto/update-transcript.dto';

@ApiTags('Transcripts')
@Controller('transcripts')
export class TranscriptsController {
  constructor(private readonly transcriptsService: TranscriptsService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo mới Transcript' })
  create(@Body() createTranscriptDto: CreateTranscriptDto) {
    return this.transcriptsService.create(createTranscriptDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách Transcripts' })
  findAll() {
    return this.transcriptsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết Transcript' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.transcriptsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật Transcript' })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateTranscriptDto: UpdateTranscriptDto) {
    return this.transcriptsService.update(id, updateTranscriptDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa Transcript' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.transcriptsService.remove(id);
  }
}