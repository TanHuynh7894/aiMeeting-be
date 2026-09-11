import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class CreateAudioSegmentDto {
  @ApiProperty({ description: 'ID của Audio Upload gốc', example: 1 })
  @IsNumber()
  audioUploadId!: number;
}

