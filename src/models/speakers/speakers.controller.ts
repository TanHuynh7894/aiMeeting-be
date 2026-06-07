import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SpeakersService } from './speakers.service';
import { CreateSpeakerDto } from './dto/create-speaker.dto';
import { UpdateSpeakerDto } from './dto/update-speaker.dto';

@ApiTags('Speakers') // Tạo nhóm quản lý riêng trên giao diện Swagger UI
@Controller('speakers')
export class SpeakersController {
  constructor(private readonly speakersService: SpeakersService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo mới một Speaker' })
  @ApiResponse({ status: 201, description: 'Tạo mới thành công.' })
  create(@Body() createSpeakerDto: CreateSpeakerDto) {
    return this.speakersService.create(createSpeakerDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách tất cả Speakers' })
  @ApiResponse({ status: 200, description: 'Thành công.' })
  findAll() {
    return this.speakersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin chi tiết một Speaker theo ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.speakersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật thông tin của Speaker' })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateSpeakerDto: UpdateSpeakerDto) {
    return this.speakersService.update(id, updateSpeakerDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa một Speaker ra khỏi hệ thống' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.speakersService.remove(id);
  }
}