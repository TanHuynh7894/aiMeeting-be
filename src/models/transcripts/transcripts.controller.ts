import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, Query, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiQuery } from '@nestjs/swagger';
import { TranscriptsService } from './transcripts.service';
import { CreateTranscriptDto, SttCallbackDto } from './dto/create-transcript.dto';
import { UpdateTranscriptDto } from './dto/update-transcript.dto';

@ApiTags('Transcripts')
@Controller('transcripts')
export class TranscriptsController {
  constructor(private readonly transcriptsService: TranscriptsService) {}

  @Post('send-stt/:audioSegmentId')
  @ApiOperation({ summary: '1. Gửi file Audio Segment tới STT Worker (WK_STT_URL) & RabbitMQ (stt-audio)' })
  async sendSegmentToSttByParam(@Param('audioSegmentId', ParseIntPipe) audioSegmentId: number) {
    return await this.transcriptsService.sendSegmentToStt(audioSegmentId);
  }

  @Post('send-stt-all/:audioUploadId')
  @ApiOperation({ summary: '1b. Tự động lấy tất cả AudioSegments thuộc audioUploadId và gửi sang STT Worker & RabbitMQ (Path Param)' })
  async sendAllSegmentsToSttByParam(@Param('audioUploadId', ParseIntPipe) audioUploadId: number) {
    return await this.transcriptsService.sendAllSegmentsToSttByUploadId(audioUploadId);
  }

  @Post('send-stt-all')
  @ApiOperation({ summary: '1c. Tự động lấy tất cả AudioSegments thuộc audioUploadId và gửi sang STT Worker & RabbitMQ (Body JSON)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        audioUploadId: { type: 'number', example: 1, description: 'ID của Audio Upload' },
      },
    },
  })
  async sendAllSegmentsToSttByBody(
    @Body('audioUploadId') audioUploadIdInput: number | string,
  ) {
    if (!audioUploadIdInput) {
      throw new BadRequestException('Vui lòng cung cấp audioUploadId!');
    }
    const audioUploadId = typeof audioUploadIdInput === 'string' ? parseInt(audioUploadIdInput, 10) : audioUploadIdInput;
    return await this.transcriptsService.sendAllSegmentsToSttByUploadId(audioUploadId);
  }

  @Post('stt-callback')
  @ApiOperation({ summary: '2. Callback API: Nhận kết quả văn bản từ STT Worker / AI Server và lưu vào bảng transcripts' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        audio_segment_id: { type: 'number', example: 1, description: 'ID của Audio Segment' },
        transcript_text: { type: 'string', example: 'Xin chào mọi người trong cuộc họp', description: 'Nội dung văn bản STT' },
      },
    },
  })
  async sttCallback(@Body() dto: SttCallbackDto) {
    return await this.transcriptsService.saveSttCallback(dto);
  }

  @Post()
  @ApiOperation({ summary: 'Tạo mới Transcript trực tiếp' })
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