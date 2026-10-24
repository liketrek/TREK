import type { RunProfile } from '@trek/shared';
import { Activity, Trees, type LucideIcon } from 'lucide-react';

/** RUN-01, RUN-02: the icon a run profile goes by, in its picker and on a run's head. */
export const RUN_PROFILE_ICON: Record<RunProfile, LucideIcon> = { running: Activity, trail: Trees };
