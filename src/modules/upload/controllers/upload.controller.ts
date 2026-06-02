import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Body,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from '../services/upload.service';

@Controller('upload')
export class UploadController {
  constructor(
    private readonly uploadService: UploadService,
  ) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file'),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('email') email: string,
  ) {
    return this.uploadService.upload(
      file,
      email,
    );
  }
}