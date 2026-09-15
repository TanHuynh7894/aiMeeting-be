import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateTranscriptDto {
  @ApiProperty({ description: 'ID của Audio Upload', example: 1, required: false })
  @IsOptional()
  @IsNumber()
  audioUploadId?: number;

  @ApiProperty({ description: 'ID của Audio Segment', example: 1, required: false })
  @IsOptional()
  @IsNumber()
  audioSegmentId?: number;

  @ApiProperty({ description: 'Nội dung văn bản chuyển từ giọng nói (STT)', example: 'Xin chào tất cả mọi người', required: true })
  @IsString()
  transcriptText!: string;

  @ApiProperty({ description: 'ID của Storage Object chứa file transcript (nếu có)', example: 1, required: false })
  @IsOptional()
  @IsNumber()
  transcriptStorageObjectId?: number;
}

export class SttCallbackDto {
  @ApiProperty({ description: 'ID của Audio Segment', example: 1, required: true })
  @IsOptional()
  audio_segment_id?: number;

  @IsOptional()
  audioSegmentId?: number;

  @IsOptional()
  audioUploadId?: number;

  @IsOptional()
  audio_upload_id?: number;

  @ApiProperty({ description: 'Nội dung văn bản nhận diện được từ STT Worker', example: 'Xin chào mọi người trong cuộc họp', required: true })
  @IsOptional()
  @IsString()
  transcript_text?: string;

  @IsOptional()
  @IsString()
  transcriptText?: string;
}



