import { AdminGuard } from '../auth-core/admin.guard';
import { JwtAuthGuard } from '../auth-core/jwt-auth.guard';
import { ParseRowIdPipe } from '../common/row-id.pipe';
import { SchoolHolidaysService } from './school-holidays.service';
import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards, BadRequestException } from '@nestjs/common';
import { schoolHolidayCountryRequestSchema, schoolHolidayRegionRequestSchema } from '@trek/shared';

import { createZodDto } from 'nestjs-zod';

export class SchoolHolidayCountryDto extends createZodDto(schoolHolidayCountryRequestSchema) {}
export class SchoolHolidayRegionDto extends createZodDto(schoolHolidayRegionRequestSchema) {}

@Controller('api/school-holiday-catalog')
@UseGuards(JwtAuthGuard)
export class SchoolHolidaysController {
  constructor(private readonly holidays: SchoolHolidaysService) {}

  @Get()
  async catalog() {
    return this.holidays.catalog();
  }

  @Get('regions/:id')
  async region(@Param('id', ParseRowIdPipe) id: number) {
    return this.holidays.region(id);
  }

  @Get('regions/:id/holidays/:year')
  async forYear(@Param('id', ParseRowIdPipe) id: number, @Param('year') year: string) {
    if (!/^\d{4}$/.test(year)) throw new BadRequestException('Invalid year');
    return this.holidays.holidays(id, year);
  }

  @Post('countries')
  @UseGuards(AdminGuard)
  async createCountry(@Body() body: SchoolHolidayCountryDto) {
    return this.holidays.createCountry(body);
  }

  @Delete('countries/:code')
  @UseGuards(AdminGuard)
  async deleteCountry(@Param('code') code: string) {
    return this.holidays.deleteCountry(code);
  }

  @Post('countries/:code/regions')
  @UseGuards(AdminGuard)
  async createRegion(@Param('code') code: string, @Body() body: SchoolHolidayRegionDto) {
    return this.holidays.createRegion(code, body);
  }

  @Put('regions/:id')
  @UseGuards(AdminGuard)
  async updateRegion(@Param('id', ParseRowIdPipe) id: number, @Body() body: SchoolHolidayRegionDto) {
    return this.holidays.updateRegion(id, body);
  }

  @Delete('regions/:id')
  @UseGuards(AdminGuard)
  async deleteRegion(@Param('id', ParseRowIdPipe) id: number, @Query('revision', ParseRowIdPipe) revision: number) {
    return this.holidays.deleteRegion(id, revision);
  }
}
