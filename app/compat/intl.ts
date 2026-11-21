// These FormatJS major versions work without native BigInt.
import '@formatjs/intl-getcanonicallocales/polyfill';
import '@formatjs/intl-locale/polyfill';
import '@formatjs/intl-pluralrules/polyfill';
import '@formatjs/intl-pluralrules/locale-data/en';
import '@formatjs/intl-pluralrules/locale-data/ru';
import '@formatjs/intl-numberformat/polyfill';
import '@formatjs/intl-numberformat/locale-data/en';
import '@formatjs/intl-numberformat/locale-data/ru';
import '@formatjs/intl-datetimeformat/polyfill';
import '@formatjs/intl-datetimeformat/locale-data/en';
import '@formatjs/intl-datetimeformat/locale-data/ru';
import '@formatjs/intl-datetimeformat/add-all-tz';
import { DateTimeFormat } from '@formatjs/intl-datetimeformat';

export function setDefaultTimeZone(timeZone: string) {
  DateTimeFormat.__setDefaultTimeZone(timeZone);
}
