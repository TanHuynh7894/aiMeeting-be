import { Controller, Post, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiConsumes, ApiBody, ApiOperation } from '@nestjs/swagger';
import { UploadService } from './upload.service';

@ApiTags('Upload') // Gom nhóm API trên Swagger
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @ApiOperation({ summary: 'Upload file lên NAS' })
  @ApiConsumes('multipart/form-data') // Báo cho Swagger biết đây là form upload file
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { // Tên trường (field name) phải khớp với FileInterceptor bên dưới
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file')) // Nhận luồng dữ liệu file
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Vui lòng chọn một file để upload!');
    }
    return this.uploadService.uploadFile(file);
  }
}