import { Injectable } from '@nestjs/common';
import { extname } from 'path';

@Injectable()
export class UploadService {
  async handleFileUpload(file: Express.Multer.File) {
    if (!file) {
      throw new Error('File not found');
    }
    
    // Return the relative path that will be stored in database
    // We'll use /uploads/ filename format
    return `/uploads/${file.filename}`;
  }
}
