import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query, UseGuards, BadRequestException } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import { schoolHolidayCountryRequestSchema, schoolHolidayRegionRequestSchema } from '@trek/shared';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { SchoolHolidaysService } from './school-holidays.service';

export class SchoolHolidayCountryDto extends createZodDto(schoolHolidayCountryRequestSchema) {}
export class SchoolHolidayRegionDto extends createZodDto(schoolHolidayRegionRequestSchema) {}

@Controller('api/school-holiday-catalog')
@UseGuards(JwtAuthGuard)
export class SchoolHolidaysController {
  constructor(private readonly holidays: SchoolHolidaysService) {}

  @Get()
  catalog() { return this.holidays.catalog(); }

  @Get('regions/:id')
  region(@Param('id', ParseIntPipe) id: number) { return this.holidays.region(id); }

  @Get('regions/:id/holidays/:year')
  forYear(@Param('id', ParseIntPipe) id: number, @Param('year') year: string) {
    if (!/^\d{4}$/.test(year)) throw new BadRequestException('Invalid year');
    return this.holidays.holidays(id, year);
  }

  @Post('countries')
  @UseGuards(AdminGuard)
  createCountry(@Body() body: SchoolHolidayCountryDto) { return this.holidays.createCountry(body); }

  @Delete('countries/:code')
  @UseGuards(AdminGuard)
  deleteCountry(@Param('code') code: string) { return this.holidays.deleteCountry(code); }

  @Post('countries/:code/regions')
  @UseGuards(AdminGuard)
  createRegion(@Param('code') code: string, @Body() body: SchoolHolidayRegionDto) { return this.holidays.createRegion(code, body); }

  @Put('regions/:id')
  @UseGuards(AdminGuard)
  updateRegion(@Param('id', ParseIntPipe) id: number, @Body() body: SchoolHolidayRegionDto) { return this.holidays.updateRegion(id, body); }

  @Delete('regions/:id')
  @UseGuards(AdminGuard)
  deleteRegion(@Param('id', ParseIntPipe) id: number, @Query('revision', ParseIntPipe) revision: number) { return this.holidays.deleteRegion(id, revision); }
}
