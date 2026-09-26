import { BullModule, InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { BadRequestException, Body, Controller, Get, Injectable, Module, NotFoundException, Param, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Queue, type Job } from 'bullmq';
import { parse } from 'csv-parse/sync';
import { readSheet } from 'read-excel-file/node';
import type { Express } from 'express';
import { extname } from 'node:path';
import { IsUUID } from 'class-validator';
import { CurrentUser, type AuthUser } from '../../common/decorators/current-user.decorator';
import { importFingerprint, parseImportRow, signedAmount } from '../../domain/finance';
import { AuditService } from '../audit/audit.service';
import { CategorizationModule, CategorizationService } from '../categorization/categorization.module';
import { PrismaService } from '../prisma/prisma.service';

type ImportRow = Record<string, string | number | boolean | null>;
type ImportMapping = { date: string; description: string; amount: string; merchant?: string };

class ImportUploadDto {
  @IsUUID()
  accountId: string;
}

@Injectable()
class ImportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    @InjectQueue('transaction-imports') private readonly queue: Queue,
  ) {}

  list(userId: string) {
    return this.prisma.importJob.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 30 });
  }

  async preview(userId: string, accountId: string, file?: Express.Multer.File) {
    if (!file) throw new BadRequestException('CSV or XLSX file is required');
    const account = await this.prisma.account.findFirst({ where: { id: accountId, userId, archivedAt: null } });
    if (!account) throw new NotFoundException('Account not found');
    const extension = extname(file.originalname).toLowerCase();
    if (!['.csv', '.xlsx'].includes(extension)) throw new BadRequestException('Only CSV and XLSX files are supported');
    const rows = extension === '.csv' ? this.parseCsv(file.buffer) : await this.parseXlsx(file.buffer);
    if (!rows.length) throw new BadRequestException('The file does not contain data rows');
    if (rows.length > 10_000) throw new BadRequestException('An import can contain at most 10,000 rows');
    const mapping = this.suggestMapping(Object.keys(rows[0]));
    const validation = rows.slice(0, 100).map((row, index) => this.validateRow(row, mapping, index + 2));
    const job = await this.prisma.importJob.create({
      data: { userId, accountId, fileName: file.originalname, mapping, previewRows: rows, invalidCount: validation.filter((row) => row.errors.length).length },
    });
    return { id: job.id, fileName: job.fileName, headers: Object.keys(rows[0]), mapping, preview: validation.slice(0, 25), totalRows: rows.length };
  }

  async confirm(userId: string, id: string, mapping?: ImportMapping) {
    const importJob = await this.prisma.importJob.findFirst({ where: { id, userId, status: 'PREVIEW' } });
    if (!importJob) throw new NotFoundException('Import preview not found or already submitted');
    const selected = mapping ?? (importJob.mapping as ImportMapping);
    this.assertMapping(selected);
    await this.prisma.importJob.update({ where: { id }, data: { mapping: selected, status: 'QUEUED' } });
    await this.queue.add('import', { importJobId: id }, { jobId: id, attempts: 3, backoff: { type: 'exponential', delay: 1000 }, removeOnComplete: 50, removeOnFail: 50 });
    await this.audit.record({ userId, action: 'TRANSACTION_IMPORT_QUEUED', entityType: 'ImportJob', entityId: id, metadata: { fileName: importJob.fileName } });
    return { id, status: 'QUEUED' };
  }

  validateRow(row: ImportRow, mapping: ImportMapping, rowNumber: number) {
    const result = parseImportRow(row, mapping);
    return { rowNumber, source: row, parsed: result.value ? { ...result.value, date: result.value.date.toISOString() } : null, errors: result.errors };
  }

  private parseCsv(buffer: Buffer): ImportRow[] {
    return parse(buffer, { columns: true, skip_empty_lines: true, trim: true, bom: true, relax_column_count: false });
  }
  private async parseXlsx(buffer: Buffer): Promise<ImportRow[]> {
    const [headerRow = [], ...dataRows] = await readSheet(buffer);
    const headers = headerRow.map((cell) => String(cell ?? '').trim());
    return dataRows.map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] instanceof Date ? row[index].toISOString() : row[index] ?? null]).filter(([header]) => header)) as ImportRow);
  }
  private suggestMapping(headers: string[]): ImportMapping {
    const find = (candidates: string[]) => headers.find((header) => candidates.includes(header.trim().toLowerCase()));
    const date = find(['date', 'transaction date', 'дата']);
    const description = find(['description', 'details', 'memo', 'опис', 'описание']);
    const amount = find(['amount', 'sum', 'сума', 'сумма']);
    const merchant = find(['merchant', 'payee', 'продавець', 'получатель']);
    if (!date || !description || !amount) throw new BadRequestException('Could not map required Date, Description and Amount columns');
    return { date, description, amount, merchant };
  }
  private assertMapping(mapping: ImportMapping): void {
    if (!mapping?.date || !mapping.description || !mapping.amount) throw new BadRequestException('Date, description and amount mappings are required');
  }
}

@Processor('transaction-imports')
class ImportsProcessor extends WorkerHost {
  constructor(private readonly prisma: PrismaService, private readonly categorization: CategorizationService) { super(); }
  async process(job: Job<{ importJobId: string }>): Promise<{ imported: number; skipped: number; invalid: number }> {
    const importJob = await this.prisma.importJob.findUniqueOrThrow({ where: { id: job.data.importJobId }, include: { user: true } });
    const account = await this.prisma.account.findFirstOrThrow({ where: { id: importJob.accountId, userId: importJob.userId } });
    const rows = importJob.previewRows as ImportRow[];
    const mapping = importJob.mapping as ImportMapping;
    await this.prisma.importJob.update({ where: { id: importJob.id }, data: { status: 'PROCESSING' } });
    let imported = 0;
    let skipped = 0;
    let invalid = 0;
    try {
      for (let index = 0; index < rows.length; index += 1) {
        const validated = this.validate(rows[index], mapping);
        if (!validated) { invalid += 1; continue; }
        const fingerprint = importFingerprint(account.id, validated.date, validated.description, validated.amount);
        if (await this.prisma.transaction.findFirst({ where: { userId: importJob.userId, importFingerprint: fingerprint } })) { skipped += 1; continue; }
        const type = validated.amount > 0 ? 'INCOME' : 'EXPENSE';
        const amount = Math.abs(validated.amount);
        const categoryId = await this.categorization.resolve(importJob.userId, validated.description, validated.merchant);
        await this.prisma.$transaction(async (db) => {
          await db.transaction.create({ data: { userId: importJob.userId, accountId: account.id, categoryId, amount, currency: account.currency, type, description: validated.description, merchant: validated.merchant || null, date: validated.date, importFingerprint: fingerprint, tags: ['imported'] } });
          await db.account.update({ where: { id: account.id }, data: { currentBalance: { increment: signedAmount(type, amount) } } });
        });
        imported += 1;
      }
      await this.prisma.importJob.update({ where: { id: importJob.id }, data: { status: 'COMPLETED', importedCount: imported, skippedCount: skipped, invalidCount: invalid } });
      await this.prisma.auditLog.create({ data: { userId: importJob.userId, action: 'TRANSACTIONS_IMPORTED', entityType: 'ImportJob', entityId: importJob.id, metadata: { imported, skipped, invalid } } });
      return { imported, skipped, invalid };
    } catch (error) {
      await this.prisma.importJob.update({ where: { id: importJob.id }, data: { status: 'FAILED', errorMessage: error instanceof Error ? error.message.slice(0, 500) : 'Import failed' } });
      throw error;
    }
  }
  private validate(row: ImportRow, mapping: ImportMapping) {
    return parseImportRow(row, mapping).value;
  }
}

@Controller('imports')
class ImportsController {
  constructor(private readonly imports: ImportsService) {}
  @Get() list(@CurrentUser() user: AuthUser) { return this.imports.list(user.id); }
  @Post('preview')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
  preview(@CurrentUser() user: AuthUser, @Body() dto: ImportUploadDto, @UploadedFile() file?: Express.Multer.File) { return this.imports.preview(user.id, dto.accountId, file); }
  @Post(':id/confirm')
  confirm(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body('mapping') mapping?: ImportMapping) { return this.imports.confirm(user.id, id, mapping); }
}

@Module({
  imports: [BullModule.registerQueue({ name: 'transaction-imports' }), CategorizationModule],
  controllers: [ImportsController],
  providers: [ImportsService, ImportsProcessor],
})
export class ImportsModule {}
