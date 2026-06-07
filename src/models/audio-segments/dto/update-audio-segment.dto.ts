import { PartialType } from '@nestjs/swagger';
import { CreateAudioSegmentDto } from './create-audio-segment.dto';

export class UpdateAudioSegmentDto extends PartialType(CreateAudioSegmentDto) {}
