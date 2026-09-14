import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class CreateAudioUploadSpeakerDto {
  @ApiProperty({ description: 'ID của Audio Upload', example: 1 })
  @IsNumber()
  audioUploadId!: number;

  @ApiProperty({ description: 'ID của Speaker', example: 1 })
  @IsNumber()
  speakerId!: number;
}
