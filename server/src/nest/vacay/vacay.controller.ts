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
  UseGuards,
} from '@nestjs/common';
import type { User } from '../../types';
import { VacayService } from './vacay.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

/**
 * /api/addons/vacay — shared vacation-day planner.
 *
 * Byte-identical to the legacy Express route (server/src/routes/vacay.ts): all
 * endpoints require auth; the X-Socket-Id header is forwarded to the services so
 * the originating client is excluded from the broadcast; POSTs answer 200 (the
 * legacy route uses res.json, not 201); and the bespoke 400/403/404/502 bodies
 * are reproduced exactly. No addon gate — the legacy mount has none.
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
  async updatePlan(@CurrentUser() user: User, @Body() body: Record<string, unknown>, @Headers('x-socket-id') socketId?: string) {
    const planId = this.vacay.getActivePlanId(user.id);
    return this.vacay.updatePlan(planId, body, socketId);
  }

  @Post('plan/holiday-calendars')
  @HttpCode(200)
  addHolidayCalendar(
    @CurrentUser() user: User,
    @Body() body: { region?: string; label?: string | null; color?: string; sort_order?: number },
    @Headers('x-socket-id') socketId?: string,
  ) {
    if (!body.region) {
      throw new HttpException({ error: 'region required' }, 400);
    }
    const planId = this.vacay.getActivePlanId(user.id);
    const calendar = this.vacay.addHolidayCalendar(planId, body.region, body.label ?? null, body.color, body.sort_order, socketId);
    return { calendar };
  }

  @Put('plan/holiday-calendars/:id')
  updateHolidayCalendar(
    @CurrentUser() user: User,
    @Param('id') idParam: string,
    @Body() body: Record<string, unknown>,
    @Headers('x-socket-id') socketId?: string,
  ) {
    const id = parseInt(idParam);
    const planId = this.vacay.getActivePlanId(user.id);
    const calendar = this.vacay.updateHolidayCalendar(id, planId, body, socketId);
    if (!calendar) {
      throw new HttpException({ error: 'Calendar not found' }, 404);
    }
    return { calendar };
  }

  @Delete('plan/holiday-calendars/:id')
  deleteHolidayCalendar(@CurrentUser() user: User, @Param('id') idParam: string, @Headers('x-socket-id') socketId?: string) {
    const id = parseInt(idParam);
    const planId = this.vacay.getActivePlanId(user.id);
    if (!this.vacay.deleteHolidayCalendar(id, planId, socketId)) {
      throw new HttpException({ error: 'Calendar not found' }, 404);
    }
    return { success: true };
  }

  @Put('color')
  setColor(
    @CurrentUser() user: User,
    @Body() body: { color?: string; target_user_id?: number | string },
    @Headers('x-socket-id') socketId?: string,
  ) {
    const planId = this.vacay.getActivePlanId(user.id);
    const userId = body.target_user_id ? parseInt(String(body.target_user_id)) : user.id;
    if (!this.vacay.getPlanUsers(planId).find((u) => u.id === userId)) {
      throw new HttpException({ error: 'User not in plan' }, 403);
    }
    this.vacay.setUserColor(userId, planId, body.color, socketId);
    return { success: true };
  }

  @Post('invite')
  @HttpCode(200)
  invite(@CurrentUser() user: User, @Body('user_id') userIdInput?: number | string) {
    if (!userIdInput) {
      throw new HttpException({ error: 'user_id required' }, 400);
    }
    const plan = this.vacay.getActivePlan(user.id);
    const result = this.vacay.sendInvite(plan.id, user.id, user.username, user.email, userIdInput as number);
    if (result.error) {
      throw new HttpException({ error: result.error }, result.status!);
    }
    return { success: true };
  }

  @Post('invite/accept')
  @HttpCode(200)
  acceptInvite(@CurrentUser() user: User, @Body('plan_id') planId: number, @Headers('x-socket-id') socketId?: string) {
    const result = this.vacay.acceptInvite(user.id, planId, socketId);
    if (result.error) {
      throw new HttpException({ error: result.error }, result.status!);
    }
    return { success: true };
  }

  @Post('invite/decline')
  @HttpCode(200)
  declineInvite(@CurrentUser() user: User, @Body('plan_id') planId: number, @Headers('x-socket-id') socketId?: string) {
    this.vacay.declineInvite(user.id, planId, socketId);
    return { success: true };
  }

  @Post('invite/cancel')
  @HttpCode(200)
  cancelInvite(@CurrentUser() user: User, @Body('user_id') targetUserId: number) {
    const plan = this.vacay.getActivePlan(user.id);
    this.vacay.cancelInvite(plan.id, targetUserId);
    return { success: true };
  }

  @Post('dissolve')
  @HttpCode(200)
  dissolve(@CurrentUser() user: User, @Headers('x-socket-id') socketId?: string) {
    this.vacay.dissolvePlan(user.id, socketId);
    return { success: true };
  }

  @Get('available-users')
  availableUsers(@CurrentUser() user: User) {
    const planId = this.vacay.getActivePlanId(user.id);
    return { users: this.vacay.getAvailableUsers(user.id, planId) };
  }

  @Get('years')
  years(@CurrentUser() user: User) {
    const planId = this.vacay.getActivePlanId(user.id);
    return { years: this.vacay.listYears(planId) };
  }

  @Post('years')
  @HttpCode(200)
  addYear(@CurrentUser() user: User, @Body('year') year?: number, @Headers('x-socket-id') socketId?: string) {
    if (!year) {
      throw new HttpException({ error: 'Year required' }, 400);
    }
    const planId = this.vacay.getActivePlanId(user.id);
    return { years: this.vacay.addYear(planId, year, socketId) };
  }

  @Delete('years/:year')
  deleteYear(@CurrentUser() user: User, @Param('year') yearParam: string, @Headers('x-socket-id') socketId?: string) {
    const year = parseInt(yearParam);
    const planId = this.vacay.getActivePlanId(user.id);
    return { years: this.vacay.deleteYear(planId, year, socketId) };
  }

  @Get('entries/:year')
  entries(@CurrentUser() user: User, @Param('year') year: string) {
    const planId = this.vacay.getActivePlanId(user.id);
    return this.vacay.getEntries(planId, year);
  }

  @Post('entries/toggle')
  @HttpCode(200)
  toggleEntry(
    @CurrentUser() user: User,
    @Body() body: { date?: string; target_user_id?: number | string },
    @Headers('x-socket-id') socketId?: string,
  ) {
    if (!body.date) {
      throw new HttpException({ error: 'date required' }, 400);
    }
    const planId = this.vacay.getActivePlanId(user.id);
    let userId = user.id;
    if (body.target_user_id && parseInt(String(body.target_user_id)) !== user.id) {
      const tid = parseInt(String(body.target_user_id));
      if (!this.vacay.getPlanUsers(planId).find((u) => u.id === tid)) {
        throw new HttpException({ error: 'User not in plan' }, 403);
      }
      userId = tid;
    }
    return this.vacay.toggleEntry(userId, planId, body.date, socketId);
  }

  @Post('entries/company-holiday')
  @HttpCode(200)
  companyHoliday(
    @CurrentUser() user: User,
    @Body() body: { date?: string; note?: string },
    @Headers('x-socket-id') socketId?: string,
  ) {
    const planId = this.vacay.getActivePlanId(user.id);
    return this.vacay.toggleCompanyHoliday(planId, body.date as string, body.note, socketId);
  }

  @Get('stats/:year')
  stats(@CurrentUser() user: User, @Param('year') yearParam: string) {
    const year = parseInt(yearParam);
    const planId = this.vacay.getActivePlanId(user.id);
    return { stats: this.vacay.getStats(planId, year) };
  }

  @Put('stats/:year')
  updateStats(
    @CurrentUser() user: User,
    @Param('year') yearParam: string,
    @Body() body: { vacation_days?: number; target_user_id?: number | string },
    @Headers('x-socket-id') socketId?: string,
  ) {
    const year = parseInt(yearParam);
    const planId = this.vacay.getActivePlanId(user.id);
    const userId = body.target_user_id ? parseInt(String(body.target_user_id)) : user.id;
    if (!this.vacay.getPlanUsers(planId).find((u) => u.id === userId)) {
      throw new HttpException({ error: 'User not in plan' }, 403);
    }
    this.vacay.updateStats(userId, planId, year, body.vacation_days as number, socketId);
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
}
