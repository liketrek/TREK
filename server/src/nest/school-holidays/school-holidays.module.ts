import { SchoolHolidayCountries } from '../../db/entities/SchoolHolidayCountries.entity';
import { SchoolHolidayPeriods } from '../../db/entities/SchoolHolidayPeriods.entity';
import { SchoolHolidayRegions } from '../../db/entities/SchoolHolidayRegions.entity';
import { VacayHolidayCalendars } from '../../db/entities/VacayHolidayCalendars.entity';
import { McpSharedModule } from '../mcp-shared/mcp-shared.module';
import { SchoolHolidaysController } from './school-holidays.controller';
import { SchoolHolidaysMcp } from './school-holidays.mcp';
import { SchoolHolidaysService } from './school-holidays.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

// MikroOrmModule.forFeature registers each repository for its
// @InjectRepository(...) in SchoolHolidaysService — the forFeature +
// @InjectRepository wiring pattern every domain copies (settings.module.ts's
// precedent comment). VacayHolidayCalendars is vacay's entity (Plan 3f Task
// 5, not yet landed) — registered here only because this service injects
// its repository for SH14's cross-domain guard (`existsForSchoolRegion`);
// no other change to that domain.
@Module({
  imports: [
    McpSharedModule,
    MikroOrmModule.forFeature([
      SchoolHolidayCountries,
      SchoolHolidayRegions,
      SchoolHolidayPeriods,
      VacayHolidayCalendars,
    ]),
  ],
  controllers: [SchoolHolidaysController],
  providers: [SchoolHolidaysService, SchoolHolidaysMcp],
})
export class SchoolHolidaysModule {}
