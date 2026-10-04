import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpException,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { User } from '../../types';
import { VacayService } from './vacay.service';
import {
  VacayAddHolidayCalendarDto,
  VacayAddYearDto,
  VacayCompanyHolidayDto,
  VacayInviteActionDto,
  VacayInviteDto,
  VacaySetColorDto,
  VacayShareDto,
  VacayShareUpdateDto,
  VacayToggleEntryDto,
  VacayUpdateHolidayCalendarDto,
  VacayUpdatePlanDto,
  VacayUpdateStatsDto,
  VacayYearSettingsDto,
} from './vacay.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

/**
 * /api/addons/vacay — shared vacation-day planner.
 *
 * Byte-identical to the legacy Express route (server/src/routes/vacay.ts): all
 * endpoints require auth; the X-Socket-Id header is forwarded to the services so
 * the originating client is excluded from the broadcast; POSTs answer 200 (the
 * legacy route uses res.json, not 201); and the bespoke 403/404/502 bodies are
 * reproduced exactly. No addon gate — the legacy mount has none.
 *
 * Bodies validate against the @trek/shared vacay schemas via the DTO classes in
 * vacay.dto.ts + the global ZodValidationPipe (400 with the standard `{ error }`
 * envelope on mismatch — this replaced the bespoke 'region required' and
 * 'date required' checks). The 'user_id required' / 'Year required' guards stay:
 * the schemas accept falsy-but-present values (0, ''), which the legacy route
 * rejected with those exact bodies.
 */
@Controller('api/addons/vacay')
@UseGuards(JwtAuthGuard)
export class VacayController {
  constructor(private readonly vacay: VacayService) {}

  @Get('plan')
  getPlan(@CurrentUser() user: User) {
    return this.vacay.getPlanData(user.id);
  }

  @Put('plan')
  async updatePlan(@CurrentUser() user: User, @Body() body: VacayUpdatePlanDto, @Headers('x-socket-id') socketId?: string) {
    const planId = await this.vacay.getActivePlanId(user.id);
    return this.vacay.updatePlan(planId, body, socketId);
  }

  @Post('plan/holiday-calendars')
  @HttpCode(200)
  async addHolidayCalendar(
    @CurrentUser() user: User,
    @Body() body: VacayAddHolidayCalendarDto,
    @Headers('x-socket-id') socketId?: string,
  ) {
    const planId = await this.vacay.getActivePlanId(user.id);
    const calendar = await this.vacay.addHolidayCalendar(planId, body.region, body.label ?? null, body.color, body.sort_order, socketId, body.type);
    return { calendar };
  }

  @Put('plan/holiday-calendars/:id')
  async updateHolidayCalendar(
    @CurrentUser() user: User,
    @Param('id') idParam: string,
    @Body() body: VacayUpdateHolidayCalendarDto,
    @Headers('x-socket-id') socketId?: string,
  ) {
    const id = Number.parseInt(idParam);
    const planId = await this.vacay.getActivePlanId(user.id);
    const calendar = await this.vacay.updateHolidayCalendar(id, planId, body, socketId);
    if (!calendar) {
      throw new HttpException({ error: 'Calendar not found' }, 404);
    }
    return { calendar };
  }

  @Delete('plan/holiday-calendars/:id')
  async deleteHolidayCalendar(@CurrentUser() user: User, @Param('id') idParam: string, @Headers('x-socket-id') socketId?: string) {
    const id = Number.parseInt(idParam);
    const planId = await this.vacay.getActivePlanId(user.id);
    if (!(await this.vacay.deleteHolidayCalendar(id, planId, socketId))) {
      throw new HttpException({ error: 'Calendar not found' }, 404);
    }
    return { success: true };
  }

  @Put('color')
  async setColor(
    @CurrentUser() user: User,
    @Body() body: VacaySetColorDto,
    @Headers('x-socket-id') socketId?: string,
  ) {
    const planId = await this.vacay.getActivePlanId(user.id);
    const userId = body.target_user_id ? Number.parseInt(String(body.target_user_id)) : user.id;
    if (!(await this.vacay.getPlanUsers(planId)).find((u) => u.id === userId)) {
      throw new HttpException({ error: 'User not in plan' }, 403);
    }
    await this.vacay.setUserColor(userId, planId, body.color, socketId);
    return { success: true };
  }

  @Post('invite')
  @HttpCode(200)
  async invite(@CurrentUser() user: User, @Body() body: VacayInviteDto) {
    if (!body.user_id) {
      throw new HttpException({ error: 'user_id required' }, 400);
    }
    const plan = await this.vacay.getActivePlan(user.id);
    const result = await this.vacay.sendInvite(plan.id, user.id, user.username, user.email, body.user_id as number);
    if (result.error) {
      throw new HttpException({ error: result.error }, result.status!);
    }
    return { success: true };
  }

  @Post('invite/accept')
  @HttpCode(200)
  async acceptInvite(@CurrentUser() user: User, @Body() body: VacayInviteActionDto, @Headers('x-socket-id') socketId?: string) {
    const result = await this.vacay.acceptInvite(user.id, body.plan_id as number, socketId);
    if (result.error) {
      throw new HttpException({ error: result.error }, result.status!);
    }
    return { success: true };
  }

  @Post('invite/decline')
  @HttpCode(200)
  async declineInvite(@CurrentUser() user: User, @Body() body: VacayInviteActionDto, @Headers('x-socket-id') socketId?: string) {
    await this.vacay.declineInvite(user.id, body.plan_id as number, socketId);
    return { success: true };
  }

  @Post('invite/cancel')
  @HttpCode(200)
  async cancelInvite(@CurrentUser() user: User, @Body() body: VacayInviteDto) {
    const plan = await this.vacay.getActivePlan(user.id);
    await this.vacay.cancelInvite(plan.id, body.user_id as number);
    return { success: true };
  }

  @Post('dissolve')
  @HttpCode(200)
  async dissolve(@CurrentUser() user: User, @Headers('x-socket-id') socketId?: string) {
    await this.vacay.dissolvePlan(user.id, socketId);
    return { success: true };
  }

  @Get('available-users')
  async availableUsers(@CurrentUser() user: User) {
    const planId = await this.vacay.getActivePlanId(user.id);
    return { users: await this.vacay.getAvailableUsers(user.id, planId) };
  }

  @Get('years')
  async years(@CurrentUser() user: User) {
    const planId = await this.vacay.getActivePlanId(user.id);
    return { years: await this.vacay.listYears(planId) };
  }

  @Post('years')
  @HttpCode(200)
  async addYear(@CurrentUser() user: User, @Body() body: VacayAddYearDto, @Headers('x-socket-id') socketId?: string) {
    if (!body.year) {
      throw new HttpException({ error: 'Year required' }, 400);
    }
    const planId = await this.vacay.getActivePlanId(user.id);
    return { years: await this.vacay.addYear(planId, body.year as number, socketId) };
  }

  @Delete('years/:year')
  async deleteYear(@CurrentUser() user: User, @Param('year') yearParam: string, @Headers('x-socket-id') socketId?: string) {
    const year = Number.parseInt(yearParam);
    const planId = await this.vacay.getActivePlanId(user.id);
    return { years: await this.vacay.deleteYear(planId, year, socketId) };
  }

  @Get('year-settings')
  async yearSettings(@CurrentUser() user: User) {
    return { settings: await this.vacay.getYearSettings(user.id) };
  }

  @Put('year-settings')
  async updateYearSettings(
    @CurrentUser() user: User,
    @Body() body: VacayYearSettingsDto,
  ) {
    return { settings: await this.vacay.updateYearSettings(user.id, body) };
  }

  @Get('entries/:year')
  async entries(@CurrentUser() user: User, @Param('year') year: string) {
    const planId = await this.vacay.getActivePlanId(user.id);
    // Entries load over the caller's leave-year window (#737), so a shifted year
    // returns both calendar halves the grid renders.
    return this.vacay.getEntries(planId, year, user.id);
  }

  @Post('entries/toggle')
  @HttpCode(200)
  async toggleEntry(
    @CurrentUser() user: User,
    @Body() body: VacayToggleEntryDto,
    @Headers('x-socket-id') socketId?: string,
  ) {
    const planId = await this.vacay.getActivePlanId(user.id);
    let userId = user.id;
    if (body.target_user_id && Number.parseInt(String(body.target_user_id)) !== user.id) {
      const tid = Number.parseInt(String(body.target_user_id));
      if (!(await this.vacay.getPlanUsers(planId)).find((u) => u.id === tid)) {
        throw new HttpException({ error: 'User not in plan' }, 403);
      }
      userId = tid;
    }
    const result = await this.vacay.toggleEntry(userId, planId, body.date, body.fraction, body.kind, socketId);
    if (result.error === 'weekend_blocked') {
      throw new HttpException({ error: 'Weekend days are blocked on this plan' }, 400);
    }
    return result;
  }

  @Post('entries/company-holiday')
  @HttpCode(200)
  async companyHoliday(
    @CurrentUser() user: User,
    @Body() body: VacayCompanyHolidayDto,
    @Headers('x-socket-id') socketId?: string,
  ) {
    const planId = await this.vacay.getActivePlanId(user.id);
    return this.vacay.toggleCompanyHoliday(planId, body.date, body.note, socketId, body.fraction);
  }

  @Get('stats/:year')
  async stats(@CurrentUser() user: User, @Param('year') yearParam: string) {
    const year = Number.parseInt(yearParam);
    const planId = await this.vacay.getActivePlanId(user.id);
    return { stats: await this.vacay.getStats(planId, year) };
  }

  @Put('stats/:year')
  async updateStats(
    @CurrentUser() user: User,
    @Param('year') yearParam: string,
    @Body() body: VacayUpdateStatsDto,
    @Headers('x-socket-id') socketId?: string,
  ) {
    const year = Number.parseInt(yearParam);
    const planId = await this.vacay.getActivePlanId(user.id);
    const userId = body.target_user_id ? Number.parseInt(String(body.target_user_id)) : user.id;
    if (!(await this.vacay.getPlanUsers(planId)).find((u) => u.id === userId)) {
      throw new HttpException({ error: 'User not in plan' }, 403);
    }
    await this.vacay.updateStats(userId, planId, year, body.vacation_days as number, socketId);
    return { success: true };
  }

  @Get('shares')
  shares(@CurrentUser() user: User) {
    return this.vacay.listShares(user.id);
  }

  @Post('shares')
  @HttpCode(200)
  async share(
    @CurrentUser() user: User,
    @Body() body: VacayShareDto,
    @Headers('x-socket-id') socketId?: string,
  ) {
    if (!body.user_id) {
      throw new HttpException({ error: 'user_id required' }, 400);
    }
    const result = await this.vacay.shareCalendar(user.id, user.email, Number.parseInt(String(body.user_id)), socketId);
    if (result.error) {
      throw new HttpException({ error: result.error }, result.status!);
    }
    return { success: true };
  }

  @Get('shares/available-users')
  async shareAvailableUsers(@CurrentUser() user: User) {
    return { users: await this.vacay.getShareAvailableUsers(user.id) };
  }

  @Get('shares/calendars/:year')
  async sharedCalendars(@CurrentUser() user: User, @Param('year') year: string) {
    return { calendars: await this.vacay.getSharedCalendars(user.id, year) };
  }

  @Put('shares/:id')
  async updateShare(
    @CurrentUser() user: User,
    @Param('id') idParam: string,
    @Body() body: VacayShareUpdateDto,
    @Headers('x-socket-id') socketId?: string,
  ) {
    if (!(await this.vacay.setShareHidden(Number.parseInt(idParam), user.id, body.hidden, socketId))) {
      throw new HttpException({ error: 'Share not found' }, 404);
    }
    return { success: true };
  }

  @Delete('shares/:id')
  async deleteShare(@CurrentUser() user: User, @Param('id') idParam: string, @Headers('x-socket-id') socketId?: string) {
    if (!(await this.vacay.removeShare(Number.parseInt(idParam), user.id, socketId))) {
      throw new HttpException({ error: 'Share not found' }, 404);
    }
    return { success: true };
  }

  @Get('holidays/countries')
  async holidayCountries() {
    const result = await this.vacay.getCountries();
    if (result.error) {
      throw new HttpException({ error: result.error }, 502);
    }
    return result.data;
  }

  @Get('holidays/:year/:country')
  async holidays(@Param('year') year: string, @Param('country') country: string) {
    const result = await this.vacay.getHolidays(year, country);
    if (result.error) {
      throw new HttpException({ error: result.error }, 502);
    }
    return result.data;
  }

  @Get('school-holidays/regions/:country')
  async schoolHolidayRegions(@Param('country') country: string) {
    const result = await this.vacay.getSchoolHolidayRegions(country, country.toUpperCase() === 'DE' ? 'DE' : 'EN');
    if (result.error) {
      throw new HttpException({ error: result.error }, 502);
    }
    return result.data;
  }

  @Get('school-holidays/:year/:country')
  async schoolHolidaysForCountry(
    @Param('year') year: string,
    @Param('country') country: string,
    @Query('group') group?: string,
  ) {
    return this.schoolHolidays(year, country, undefined, group);
  }

  @Get('school-holidays/:year/:country/:subdivision')
  async schoolHolidaysForSubdivision(
    @Param('year') year: string,
    @Param('country') country: string,
    @Param('subdivision') subdivision: string,
    @Query('group') group?: string,
  ) {
    return this.schoolHolidays(year, country, subdivision, group);
  }

  private async schoolHolidays(year: string, country: string, subdivision?: string, group?: string) {
    const result = await this.vacay.getSchoolHolidays(year, country, subdivision, country.toUpperCase() === 'DE' ? 'DE' : 'EN', group);
    if (result.error) {
      throw new HttpException({ error: result.error }, 502);
    }
    return result.data;
  }
}
