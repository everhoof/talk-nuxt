import { DateTime } from 'luxon';

export function toLocalDateTime(iso: string, timezone: string, compact: boolean = false) {
  const date = DateTime.fromISO(iso).setZone(timezone);
  const currentDate = DateTime.local().setZone(timezone);

  if (currentDate.startOf('day').toSeconds() === date.startOf('day').toSeconds()) {
    if (compact) return date.setLocale('ru').toFormat('HH:mm');
    return date.setLocale('ru').toFormat('Сегодня, в HH:mm');
  }

  if (currentDate.minus({ days: 1 }).startOf('day')
    .toSeconds() === date.startOf('day').toSeconds()) {
    if (compact) return date.setLocale('ru').toFormat('HH:mm');
    return date.setLocale('ru').toFormat('Вчера, в HH:mm');
  }

  if (compact) return date.setLocale('ru').toFormat('HH:mm');
  return date.setLocale('ru').toFormat('dd.LL.yyyy HH:mm');
}
