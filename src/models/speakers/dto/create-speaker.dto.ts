import { ApiProperty } from '@nestjs/swagger';

export class CreateSpeakerDto {
  @ApiProperty({ example: 'Nguyễn Văn A', description: 'Họ và tên của người nói', required: false })
  fullName?: string;

  @ApiProperty({ example: 'nguyenvana@example.com', description: 'Email liên hệ', required: false })
  email?: string;

  @ApiProperty({ example: 'host', description: 'Vai trò người nói (host, participant...)', required: false })
  speakerType?: string;
}