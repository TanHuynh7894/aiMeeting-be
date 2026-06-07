import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { EmailLogsService } from './email-logs.service';
import { CreateEmailLogDto } from './dto/create-email-log.dto';
import { UpdateEmailLogDto } from './dto/update-email-log.dto';

@ApiTags('Email Logs')
@Controller('email-logs')
export class EmailLogsController {
  constructor(private readonly emailLogsService: EmailLogsService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo mới Email Log' })
  create(@Body() createEmailLogDto: CreateEmailLogDto) {
    return this.emailLogsService.create(createEmailLogDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách Email Logs' })
  findAll() {
    return this.emailLogsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết Email Log' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.emailLogsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật Email Log' })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateEmailLogDto: UpdateEmailLogDto) {
    return this.emailLogsService.update(id, updateEmailLogDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa Email Log' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.emailLogsService.remove(id);
  }
}