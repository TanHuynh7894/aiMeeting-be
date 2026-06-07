import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { VoiceSamplesService } from './voice-samples.service';
import { CreateVoiceSampleDto } from './dto/create-voice-sample.dto';
import { UpdateVoiceSampleDto } from './dto/update-voice-sample.dto';

@ApiTags('Voice Samples')
@Controller('voice-samples')
export class VoiceSamplesController {
  constructor(private readonly voiceSamplesService: VoiceSamplesService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo mới Voice Sample' })
  create(@Body() createVoiceSampleDto: CreateVoiceSampleDto) {
    return this.voiceSamplesService.create(createVoiceSampleDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách Voice Samples' })
  findAll() {
    return this.voiceSamplesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết Voice Sample' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.voiceSamplesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật Voice Sample' })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateVoiceSampleDto: UpdateVoiceSampleDto) {
    return this.voiceSamplesService.update(id, updateVoiceSampleDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa Voice Sample' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.voiceSamplesService.remove(id);
  }
}