import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { QUEUE_NAMES } from '../../queues/queues.module';
import { StatementImportStatus } from '@prisma/client';
import { parseCsvBuffer } from './parsers/csv.parser';
import { parseExcelBuffer } from './parsers/excel.parser';
import { parsePdfBuffer } from './parsers/pdf.parser';

const ALLOWED_TYPES: Record<string, string> = {
  'text/csv': 'csv',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/csv': 'csv',
  'application/pdf': 'pdf',
};

@Injectable()
export class ImportsService {
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
    @InjectQueue(QUEUE_NAMES.STATEMENT_IMPORT) private importQueue: Queue,
  ) {}

  async list(userId: string) {
    return this.prisma.statementImport.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async findOne(userId: string, id: string) {
    const record = await this.prisma.statementImport.findFirst({
      where: { id, userId },
    });
    if (!record) throw new NotFoundException('Import not found');
    return record;
  }

  async upload(
    userId: string,
    accountId: string,
    file: Express.Multer.File,
  ) {
    const account = await this.prisma.account.findFirst({
      where: { id: accountId, userId },
    });
    if (!account) throw new NotFoundException('Account not found');

    const ext = file.originalname.split('.').pop()?.toLowerCase();
    let fileType = ALLOWED_TYPES[file.mimetype];

    if (!fileType && ext) {
      if (ext === 'csv') fileType = 'csv';
      else if (ext === 'xlsx' || ext === 'xls') fileType = 'xlsx';
      else if (ext === 'pdf') fileType = 'pdf';
    }

    if (!fileType) {
      throw new BadRequestException('Unsupported file type. Use CSV, Excel (.xlsx, .xls), or PDF');
    }

    // Validate parseable before queuing
    if (fileType === 'csv') {
      parseCsvBuffer(file.buffer);
    } else if (fileType === 'pdf') {
      await parsePdfBuffer(file.buffer);
    } else {
      parseExcelBuffer(file.buffer);
    }

    const { filePath, fileUrl } = await this.storage.saveFile(
      userId,
      file.originalname,
      file.buffer,
    );

    const importRecord = await this.prisma.statementImport.create({
      data: {
        userId,
        accountId,
        fileName: file.originalname,
        fileType,
        fileUrl,
        status: StatementImportStatus.PENDING,
      },
    });

    await this.importQueue.add('process-import', {
      importId: importRecord.id,
      userId,
      accountId,
      filePath,
      fileType,
    });

    await this.prisma.statementImport.update({
      where: { id: importRecord.id },
      data: { status: StatementImportStatus.PROCESSING },
    });

    return importRecord;
  }
}
