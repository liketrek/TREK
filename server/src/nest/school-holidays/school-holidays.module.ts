import { McpSharedModule } from '../mcp-shared/mcp-shared.module';
import { Module } from '@nestjs/common';
import { SchoolHolidaysController } from './school-holidays.controller';
import { SchoolHolidaysService } from './school-holidays.service';
import { SchoolHolidaysMcp } from './school-holidays.mcp';

@Module({ imports: [McpSharedModule], controllers: [SchoolHolidaysController], providers: [SchoolHolidaysService, SchoolHolidaysMcp] })
export class SchoolHolidaysModule {}
