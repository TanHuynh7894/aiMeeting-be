import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { MeetingMinutesService } from './meeting-minutes.service';
import { CreateMeetingMinuteDto } from './dto/create-meeting-minute.dto';
import { UpdateMeetingMinuteDto } from './dto/update-meeting-minute.dto';

@ApiTags('Meeting Minutes')
@Controller('meeting-minutes')
export class MeetingMinutesController {
  constructor(private readonly meetingMinutesService: MeetingMinutesService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo mới Meeting Minute' })
  create(@Body() createMeetingMinuteDto: CreateMeetingMinuteDto) {
    return this.meetingMinutesService.create(createMeetingMinuteDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách Meeting Minutes' })
  findAll() {
    return this.meetingMinutesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết Meeting Minute' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.meetingMinutesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật Meeting Minute' })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateMeetingMinuteDto: UpdateMeetingMinuteDto) {
    return this.meetingMinutesService.update(id, updateMeetingMinuteDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa Meeting Minute' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.meetingMinutesService.remove(id);
  }
}