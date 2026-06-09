import { Injectable, Logger } from '@nestjs/common';
import { Processor, WorkerHost, InjectQueue } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../../modules/storage/storage.service';
import { CategorizationService } from '../../modules/categorization/categorization.service';
import { QUEUE_NAMES } from '../queues.module';
import { parseCsvBuffer, mapRowType } from '../../modules/imports/parsers/csv.parser';
import { parseExcelBuffer } from '../../modules/imports/parsers/excel.parser';
import { parsePdfBuffer } from '../../modules/imports/parsers/pdf.parser';
import { StatementImportStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

interface ImportJobData {
  importId: string;
  userId: string;
  accountId: string;
  filePath: string;
  fileType: string;
}

@Processor(QUEUE_NAMES.STATEMENT_IMPORT)
export class StatementImportProcessor extends WorkerHost {
  private readonly logger = new Logger(StatementImportProcessor.name);

  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
    private categorization: CategorizationService,
    @InjectQueue(QUEUE_NAMES.ANALYTICS_REFRESH) private analyticsQueue: Queue,
    @InjectQueue(QUEUE_NAMES.INSIGHTS) private insightsQueue: Queue,
  ) {
    super();
  }

  async process(job: Job<ImportJobData>) {
    const { importId, userId, accountId, filePath, fileType } = job.data;

    try {
      const buffer = await this.storage.readFile(filePath);
      let rows;
      if (fileType === 'csv') {
        rows = parseCsvBuffer(buffer);
      } else if (fileType === 'pdf') {
        rows = await parsePdfBuffer(buffer);
      } else {
        rows = parseExcelBuffer(buffer);
      }

      if (rows.length === 0) {
        throw new Error('No valid transactions found in file');
      }

      let created = 0;

      for (const row of rows) {
        const categoryId = await this.categorization.categorize(userId, row.merchant);

        let merchantId: string | undefined;
        if (row.merchant) {
          const merchant = await this.prisma.merchant.upsert({
            where: { name: row.merchant.toUpperCase() },
            update: {},
            create: { name: row.merchant.toUpperCase() },
          });
          merchantId = merchant.id;
        }

        const txType = mapRowType(row.type);

        await this.prisma.transaction.create({
          data: {
            userId,
            accountId,
            amount: new Decimal(row.amount),
            date: row.date,
            merchantId,
            merchantName: row.merchant,
            categoryId,
            notes: row.notes,
            type: txType,
            tags: ['imported'],
          },
        });

        created++;
      }

      await this.prisma.statementImport.update({
        where: { id: importId },
        data: {
          status: StatementImportStatus.COMPLETED,
          recordCount: created,
        },
      });

      await this.analyticsQueue.add('refresh-net-worth', { userId });
      await this.insightsQueue.add('generate-insights', { userId });

      this.logger.log(`Import ${importId} completed: ${created} transactions`);
      return { created };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Import failed';
      await this.prisma.statementImport.update({
        where: { id: importId },
        data: {
          status: StatementImportStatus.FAILED,
          errorMessage: message,
        },
      });
      this.logger.error(`Import ${importId} failed: ${message}`);
      throw error;
    }
  }
}
