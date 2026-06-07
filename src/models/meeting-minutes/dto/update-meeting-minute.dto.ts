import { PartialType } from '@nestjs/swagger';
import { CreateMeetingMinuteDto } from './create-meeting-minute.dto';

export class UpdateMeetingMinuteDto extends PartialType(CreateMeetingMinuteDto) {}
