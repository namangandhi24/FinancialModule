import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class StorageService {
  private uploadDir: string;

  constructor(private configService: ConfigService) {
    this.uploadDir = path.join(process.cwd(), 'uploads');
  }

  async ensureUploadDir() {
    await fs.mkdir(this.uploadDir, { recursive: true });
  }

  async saveFile(
    userId: string,
    originalName: string,
    buffer: Buffer,
  ): Promise<{ filePath: string; fileUrl: string }> {
    await this.ensureUploadDir();
    const userDir = path.join(this.uploadDir, userId);
    await fs.mkdir(userDir, { recursive: true });

    const ext = path.extname(originalName);
    const fileName = `${uuidv4()}${ext}`;
    const filePath = path.join(userDir, fileName);

    await fs.writeFile(filePath, buffer);

    return {
      filePath,
      fileUrl: `/uploads/${userId}/${fileName}`,
    };
  }

  async readFile(filePath: string): Promise<Buffer> {
    return fs.readFile(filePath);
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
    } catch {
      // ignore missing files
    }
  }
}
