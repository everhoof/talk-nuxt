export default defineNuxtPlugin({
  name: 'browser-compatibility',
  order: -1000,
  async setup() {
    // Reka UI uses Pointer Events for menus, selection, and outside dismissal.
    if (typeof PointerEvent !== 'function') await import('@wessberg/pointer-events');
    const hasIntl = typeof Intl.DateTimeFormat.prototype.formatToParts === 'function'
      && typeof Intl.NumberFormat.prototype.formatToParts === 'function'
      && typeof Intl.PluralRules === 'function';
    if (hasIntl) return;
    const timeZone = new Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    const { setDefaultTimeZone } = await import('../compat/intl');
    setDefaultTimeZone(timeZone);
  },
});
