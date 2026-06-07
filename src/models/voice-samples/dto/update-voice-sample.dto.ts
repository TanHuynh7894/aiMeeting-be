import { PartialType } from '@nestjs/swagger';
import { CreateVoiceSampleDto } from './create-voice-sample.dto';

export class UpdateVoiceSampleDto extends PartialType(CreateVoiceSampleDto) {}
