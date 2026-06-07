import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { VoiceSamplesService } from './voice-samples.service';
import { CreateVoiceSampleDto } from './dto/create-voice-sample.dto';
import { UpdateVoiceSampleDto } from './dto/update-voice-sample.dto';

@ApiTags('Voice Samples')
@Controller('voice-samples')
export class VoiceSamplesController {
  constructor(private readonly voiceSamplesService: VoiceSamplesService) {}

  @Post('upload-sample')
  @ApiOperation({ summary: ' 1. UPLOAD FILE: Tải mẫu giọng nói lên NAS (Tự convert sang .WAV)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        speakerId: {
          type: 'number',
          example: 1,
          description: 'ID của người nói (Bắt buộc)',
        },
        file: {
          type: 'string',
          format: 'binary',
          description: 'File audio/video chứa giọng nói cần tải lên (Bắt buộc)',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file')) 
  async uploadVoiceSample(
    @UploadedFile() file: Express.Multer.File,
    @Body('speakerId') speakerId?: string, 
  ) {
    if (!file) {
      throw new BadRequestException('Vui lòng đính kèm file media trong request!');
    }
    
    if (!speakerId) {
      throw new BadRequestException('Vui lòng cung cấp speakerId (ID của người nói)!');
    }

    const parsedSpeakerId = parseInt(speakerId, 10);

    return await this.voiceSamplesService.uploadVoiceSample(parsedSpeakerId, file);
  }

  // @Post()
  // @ApiOperation({ summary: '2. TẠO MỚI (JSON): Thêm record thủ công không kèm file' })
  // create(@Body() createVoiceSampleDto: CreateVoiceSampleDto) {
  //   return this.voiceSamplesService.create(createVoiceSampleDto);
  // }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách toàn bộ Voice Samples (Có kèm link NAS)' })
  findAll() {
    return this.voiceSamplesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết 1 Voice Sample theo ID (Có kèm link NAS)' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.voiceSamplesService.findOne(id);
  }

  // @Patch(':id')
  // @ApiOperation({ summary: 'Cập nhật thông tin Voice Sample' })
  // update(@Param('id', ParseIntPipe) id: number, @Body() updateVoiceSampleDto: UpdateVoiceSampleDto) {
  //   return this.voiceSamplesService.update(id, updateVoiceSampleDto);
  // }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa bản ghi Voice Sample' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.voiceSamplesService.remove(id);
  }
}