import { Body, Controller, Delete, Get, HttpCode, HttpException, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { PackingService } from './packing.service';
import { AdminTemplateNameDto } from '../admin/admin.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { getClientIp } from '../audit/client-ip';
import { AuditService } from '../audit/audit.service';
import type { User } from '../../types';

/** Throw the legacy {error,status} envelope when a service call reports failure. */
function ok<T>(result: T): Exclude<T, { error: string }> {
  if (result && typeof result === 'object' && 'error' in (result as Record<string, unknown>)) {
    const r = result as unknown as { error: string; status?: number };
    throw new HttpException({ error: r.error }, r.status ?? 400);
  }
  return result as Exclude<T, { error: string }>;
}

/**
 * /api/admin/packing-templates — the admin CRUD for packing templates.
 *
 * These twelve routes sat on AdminController and reached PackingService through
 * eleven pass-through methods on AdminService that did nothing but forward and cast.
 * PackingService already owns all three template tables, so the routes belong here:
 * the pass-through block is gone, and there is one owner instead of a controller in
 * one domain calling a service in another through a third.
 *
 * The path, the admin gate, the {error,status} envelope, the create-201-vs-rest-200
 * split and the audit-log writes are unchanged — this is a move, not a redesign.
 */
@Controller('api/admin/packing-templates')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminPackingTemplatesController {
  constructor(
    private readonly packing: PackingService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  list() {
    return { templates: this.packing.listPackingTemplates() };
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return ok(this.packing.getPackingTemplate(id));
  }

  @Post()
  @HttpCode(201)
  create(@CurrentUser() user: User, @Body() body: AdminTemplateNameDto, @Req() req: Request) {
    const result = ok(this.packing.createPackingTemplate(body.name, user.id));
    this.audit.writeAudit({
      userId: user.id,
      action: 'admin.packing_template_create',
      resource: String((result.template as { id?: number } | undefined)?.id ?? ''),
      ip: getClientIp(req),
      details: { name: body.name },
    });
    return result;
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: AdminTemplateNameDto) {
    return ok(this.packing.updatePackingTemplate(id, body));
  }

  @Delete(':id')
  remove(@CurrentUser() user: User, @Param('id') id: string, @Req() req: Request) {
    const result = ok(this.packing.deletePackingTemplate(id));
    this.audit.writeAudit({
      userId: user.id,
      action: 'admin.packing_template_delete',
      resource: String(id),
      ip: getClientIp(req),
      details: { name: result.name },
    });
    return { success: true };
  }

  @Post(':id/categories')
  @HttpCode(201)
  createCategory(@Param('id') id: string, @Body() body: AdminTemplateNameDto) {
    return ok(this.packing.createTemplateCategory(id, body.name));
  }

  @Put(':templateId/categories/:catId')
  updateCategory(@Param('templateId') templateId: string, @Param('catId') catId: string, @Body() body: AdminTemplateNameDto) {
    return ok(this.packing.updateTemplateCategory(templateId, catId, body));
  }

  @Delete(':templateId/categories/:catId')
  deleteCategory(@Param('templateId') templateId: string, @Param('catId') catId: string) {
    ok(this.packing.deleteTemplateCategory(templateId, catId));
    return { success: true };
  }

  @Post(':templateId/categories/:catId/items')
  @HttpCode(201)
  createItem(@Param('templateId') templateId: string, @Param('catId') catId: string, @Body() body: AdminTemplateNameDto) {
    return ok(this.packing.createTemplateItem(templateId, catId, body.name));
  }

  @Put(':templateId/items/:itemId')
  updateItem(@Param('templateId') templateId: string, @Param('itemId') itemId: string, @Body() body: AdminTemplateNameDto) {
    return ok(this.packing.updateTemplateItem(templateId, itemId, body));
  }

  @Delete(':templateId/items/:itemId')
  deleteItem(@Param('templateId') templateId: string, @Param('itemId') itemId: string) {
    ok(this.packing.deleteTemplateItem(templateId, itemId));
    return { success: true };
  }
}
