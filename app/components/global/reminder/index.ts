import type { ReminderTypes } from '~/types/reminderTypes';

export interface ReminderProps {
  id: ReminderTypes;
}

export interface ReminderEmits {
  click: [];
}

export interface ReminderSlots {
  default?(): unknown;
  button?(): unknown;
}
