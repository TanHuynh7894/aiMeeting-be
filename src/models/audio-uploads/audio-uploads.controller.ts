import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { AudioUploadsService } from './audio-uploads.service';

@ApiTags('Audio Uploads')
@Controller('audio-uploads')
export class AudioUploadsController {
  constructor(private readonly audioUploadsService: AudioUploadsService) { }

  @Post('upload-meeting')
  @ApiOperation({ summary: '1. UPLOAD FILE: Tải file audio/video lên NAS và lưu Database' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'File audio/video cần upload lên NAS (Bắt buộc)',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadMeeting(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Vui lòng đính kèm file media trong request!');
    }
    return await this.audioUploadsService.uploadMeeting(file);
  }


  @Get('analysis/:id')
  @ApiOperation({ summary: 'Phân tích tổng hợp: Thông tin Audio Upload, Speakers liên kết & Audio Segments' })
  getAnalysisByPath(@Param('id', ParseIntPipe) id: number) {
    return this.audioUploadsService.getAnalysis(id);
  }

  @Get()
  findAll() { return this.audioUploadsService.findAll(); }
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) { return this.audioUploadsService.findOne(id); }
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) { return this.audioUploadsService.remove(id); }
}