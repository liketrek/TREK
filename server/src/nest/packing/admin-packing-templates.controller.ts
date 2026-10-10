import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { PackingService } from './packing.service';
import { AdminTemplateNameDto } from './packing.dto';
import { JwtAuthGuard } from '../auth-core/jwt-auth.guard';
import { AdminGuard } from '../auth-core/admin.guard';
import { CurrentUser } from '../auth-core/current-user.decorator';
import { getClientIp } from '../audit/client-ip';
import { AuditService } from '../audit/audit.service';
import type { User } from '../../types';

/** Throw the legacy {error,status} envelope when a service call reports failure. */
@Controller('api/admin/packing-templates')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminPackingTemplatesController {
  constructor(
    private readonly packing: PackingService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  async list() {
    return { templates: await this.packing.listPackingTemplates() };
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return await this.packing.getPackingTemplate(id);
  }

  @Post()
  @HttpCode(201)
  async create(@CurrentUser() user: User, @Body() body: AdminTemplateNameDto, @Req() req: Request) {
    const result = await this.packing.createPackingTemplate(body.name, user.id);
    await this.audit.writeAudit({
      userId: user.id,
      action: 'admin.packing_template_create',
      resource: String((result.template as { id?: number } | undefined)?.id ?? ''),
      ip: getClientIp(req),
      details: { name: body.name },
    });
    return result;
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: AdminTemplateNameDto) {
    return await this.packing.updatePackingTemplate(id, body);
  }

  @Delete(':id')
  async remove(@CurrentUser() user: User, @Param('id') id: string, @Req() req: Request) {
    const result = await this.packing.deletePackingTemplate(id);
    await this.audit.writeAudit({
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
  async createCategory(@Param('id') id: string, @Body() body: AdminTemplateNameDto) {
    return await this.packing.createTemplateCategory(id, body.name);
  }

  @Put(':templateId/categories/:catId')
  async updateCategory(@Param('templateId') templateId: string, @Param('catId') catId: string, @Body() body: AdminTemplateNameDto) {
    return await this.packing.updateTemplateCategory(templateId, catId, body);
  }

  @Delete(':templateId/categories/:catId')
  async deleteCategory(@Param('templateId') templateId: string, @Param('catId') catId: string) {
    await this.packing.deleteTemplateCategory(templateId, catId);
    return { success: true };
  }

  @Post(':templateId/categories/:catId/items')
  @HttpCode(201)
  async createItem(@Param('templateId') templateId: string, @Param('catId') catId: string, @Body() body: AdminTemplateNameDto) {
    return await this.packing.createTemplateItem(templateId, catId, body.name);
  }

  @Put(':templateId/items/:itemId')
  async updateItem(@Param('templateId') templateId: string, @Param('itemId') itemId: string, @Body() body: AdminTemplateNameDto) {
    return await this.packing.updateTemplateItem(templateId, itemId, body);
  }

  @Delete(':templateId/items/:itemId')
  async deleteItem(@Param('templateId') templateId: string, @Param('itemId') itemId: string) {
    await this.packing.deleteTemplateItem(templateId, itemId);
    return { success: true };
  }
}
