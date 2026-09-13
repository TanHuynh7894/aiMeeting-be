import {
  Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe,
  UseInterceptors, UploadedFile, UploadedFiles, BadRequestException
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { AudioSegmentsService } from './audio-segments.service';
import { CreateAudioSegmentDto } from './dto/create-audio-segment.dto';
import { UpdateAudioSegmentDto } from './dto/update-audio-segment.dto';

@ApiTags('Audio Segments')
@Controller('audio-segments')
export class AudioSegmentsController {
  constructor(private readonly audioSegmentsService: AudioSegmentsService) { }

  @Post()
  @ApiOperation({ summary: '1. Gửi Audio Upload tới Worker Diarize (WK_DIARIZE_URL)' })
  create(@Body() createAudioSegmentDto: CreateAudioSegmentDto) {
    return this.audioSegmentsService.create(createAudioSegmentDto);
  }

  @Post('dispatch-queue')
  @ApiOperation({ summary: '1b. Gửi task Audio Upload tới RabbitMQ (RABBITMQ_QUEUE_AUDIO)' })
  async dispatchToQueue(@Body() dto: CreateAudioSegmentDto) {
    if (!dto || !dto.audioUploadId) {
      throw new BadRequestException('Vui lòng cung cấp audioUploadId!');
    }
    return await this.audioSegmentsService.sendToDiarizeQueue(dto.audioUploadId);
  }

  @Post('upload-segment')
  @ApiOperation({ summary: '2. UPLOAD 1 FILE SEGMENT: Nhận file đã cắt, lưu RustFS & DB' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        audioUploadId: { type: 'number', example: 1 },
        startTime: { type: 'number', example: 0.0 },
        endTime: { type: 'number', example: 15.5 },
        confidenceScore: { type: 'number', example: 0.98 },
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadSingleSegment(
    @UploadedFile() file: Express.Multer.File,
    @Body('audioUploadId') audioUploadIdStr: string,
    @Body('startTime') startTimeStr?: string,
    @Body('endTime') endTimeStr?: string,
    @Body('confidenceScore') confidenceScoreStr?: string,
  ) {
    if (!file) throw new BadRequestException('Vui lòng đính kèm file segment!');
    if (!audioUploadIdStr) throw new BadRequestException('Vui lòng cung cấp audioUploadId!');

    const audioUploadId = parseInt(audioUploadIdStr, 10);
    const startTime = startTimeStr ? parseFloat(startTimeStr) : 0;
    const endTime = endTimeStr ? parseFloat(endTimeStr) : 0;
    const confidenceScore = confidenceScoreStr ? parseFloat(confidenceScoreStr) : 0;

    return await this.audioSegmentsService.uploadSegmentFile(
      audioUploadId,
      file,
      startTime,
      endTime,
      confidenceScore,
    );
  }

  // @Post('upload-segments')
  // @ApiOperation({ summary: '3. UPLOAD NHIỀU FILE SEGMENTS: Nhận mảng file đã cắt, lưu RustFS & DB' })
  // @ApiConsumes('multipart/form-data')
  // @ApiBody({
  //   schema: {
  //     type: 'object',
  //     properties: {
  //       audioUploadId: { type: 'number', example: 1 },
  //       files: {
  //         type: 'array',
  //         items: { type: 'string', format: 'binary' },
  //       },
  //     },
  //   },
  // })
  // @UseInterceptors(FilesInterceptor('files'))
  // async uploadMultipleSegments(
  //   @UploadedFiles() files: Express.Multer.File[],
  //   @Body('audioUploadId') audioUploadIdStr: string,
  // ) {
  //   if (!files || files.length === 0) throw new BadRequestException('Vui lòng đính kèm ít nhất 1 file segment!');
  //   if (!audioUploadIdStr) throw new BadRequestException('Vui lòng cung cấp audioUploadId!');

  //   const audioUploadId = parseInt(audioUploadIdStr, 10);
  //   return await this.audioSegmentsService.uploadMultipleSegments(audioUploadId, files);
  // }

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
