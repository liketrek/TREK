export interface VacayPlan {
  id: number;
  owner_id: number;
  block_weekends: number | null;
  holidays_enabled: number | null;
  ics_holidays_enabled?: number | null;
  holidays_region: string | null;
  school_holidays_enabled: number | null;
  company_holidays_enabled: number | null;
  carry_over_enabled: number | null;
  weekend_days: string | null;
  week_start: number;
}

export interface VacayUserYear {
  user_id: number;
  plan_id: number;
  year: number;
  vacation_days: number;
  carried_over: number;
}

export interface VacayUser {
  id: number;
  username: string;
  email: string;
}

export interface VacayPlanMember {
  id: number;
  plan_id: number;
  user_id: number;
  status: string;
  created_at?: string;
}

export interface SchoolHoliday {
  startDate?: string;
  endDate?: string;
  name?: Array<{ language?: string; text?: string }> | string;
}

export interface VacayHolidayCalendar {
  id: number;
  plan_id: number;
  type: 'public_holiday' | 'school_holiday';
  region: string;
  label: string | null;
  color: string;
  sort_order: number;
}

export interface VacayUserSettings {
  user_id: number;
  year_type: 'calendar' | 'fiscal' | 'anniversary';
  year_start_month: number;
  year_start_day: number;
  hire_date: string | null;
}

export interface UpdatePlanBody {
  block_weekends?: boolean;
  holidays_enabled?: boolean;
  ics_holidays_enabled?: boolean;
  // null clears the legacy single-region field (the MCP tool and the shared
  // request schema both pass null through; SQLite stores NULL).
  holidays_region?: string | null;
  school_holidays_enabled?: boolean;
  company_holidays_enabled?: boolean;
  carry_over_enabled?: boolean;
  weekend_days?: string;
  week_start?: number;
}

export interface VacayShare {
  id: number;
  owner_id: number;
  user_id: number;
  hidden: number;
  created_at?: string;
}
