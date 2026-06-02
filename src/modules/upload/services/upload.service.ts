import { Injectable } from '@nestjs/common';

@Injectable()
export class UploadService {
  async upload(
    file: Express.Multer.File,
    email: string,
  ) {
    return {
      message: 'Upload successful',
      email,
      fileName: file.originalname,
    };
  }
}