import type { TranslationStrings } from '../types';

const trips: TranslationStrings = {
  'trips.memberRemoved': '{username} removed',
  'trips.memberRemoveError': 'Failed to remove',
  'trips.memberAdded': '{username} added',
  'trips.memberAddError': 'Failed to add',
  'trips.reminder': 'Reminder',
  'trips.reminderNone': 'None',
  'trips.reminderDay': 'day',
  'trips.reminderDays': 'days',
  'trips.reminderCustom': 'Custom',
  'trips.reminderDaysBefore': 'days before departure',
  'trips.reminderDisabledHint': 'Trip reminders are disabled. Enable them in Admin > Settings > Notifications.',
  'trips.scheduleMargin': 'Schedule margin',
  'trips.scheduleMarginHint': 'Buffer added after each scheduled place and route segment.',
  'trips.scheduleMarginInvalid': 'Enter a margin like 0m, 15m, or 1h',
  'trips.routingProvider': 'Estimated Driving Time',
  'trips.routingProviderOsrm': 'OSRM',
  'trips.routingProviderGoogle': 'Google Maps',
  'trips.routingProviderHint': 'Choose the provider used for driving-time estimates between scheduled places.',
  'trips.routingOptimism': 'Optimism',
  'trips.routingOptimismHint': "0 uses Google Maps' slowest traffic estimate, 1 uses the fastest, and 0.33 leans cautious.",
  'trips.routingPessimistic': 'Pessimistic',
  'trips.routingOptimistic': 'Optimistic',
};
export default trips;
