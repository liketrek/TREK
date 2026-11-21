import { AdminGuard } from '../auth-core/admin.guard';
import { JwtAuthGuard } from '../auth-core/jwt-auth.guard';
import { ResponseContract } from '../common/response-contract';
import { MailIngestStatusService } from './mail-ingest-status.service';
import { Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import {
  mailIngestAdminStatusResponseSchema,
  mailIngestAdminTestResponseSchema,
  type MailIngestAdminStatusResponse,
  type MailIngestAdminTestResponse,
} from '@trek/shared';

/**
 * `/api/admin/mail-ingest`: how the booking mail import runs, for the admin
 * dialog. The status card is counts only, no mail content; the test reaches
 * the configured transport and says what failed. Both read, so a managed
 * install's admin sees them too; the settings themselves are the operator's
 * there and go through the admin settings form, which withholds them.
 */
@Controller('api/admin/mail-ingest')
@UseGuards(JwtAuthGuard, AdminGuard)
export class MailIngestAdminController {
  constructor(private readonly status: MailIngestStatusService) {}

  @Get('status')
  @ResponseContract(mailIngestAdminStatusResponseSchema)
  read(): Promise<MailIngestAdminStatusResponse> {
    return this.status.status();
  }

  @Post('test')
  @HttpCode(200)
  @ResponseContract(mailIngestAdminTestResponseSchema)
  test(): Promise<MailIngestAdminTestResponse> {
    return this.status.test();
  }
}
