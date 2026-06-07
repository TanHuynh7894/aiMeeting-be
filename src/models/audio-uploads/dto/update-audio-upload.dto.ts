import { PartialType } from '@nestjs/swagger';
import { CreateAudioUploadDto } from './create-audio-upload.dto';

export class UpdateAudioUploadDto extends PartialType(CreateAudioUploadDto) {}
