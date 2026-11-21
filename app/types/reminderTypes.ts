export enum ReminderTypes {
  EMAIL_CONFIRMATION = 'email_confirmation',
}

export interface Reminder {
  type: ReminderTypes;
  userId: number;
  timeout: number;
  disabledAt: number | null;
}
