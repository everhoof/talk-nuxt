import { defineStore } from 'pinia';
import {
  reactive,
  toRefs,
} from 'vue';
import { DateTime } from 'luxon';

const state = () => ({
  isOBS: false as boolean,
  isPlay: false as boolean,
  theme: 'dark' as string,
  compact: true as boolean,
  snow: false as boolean,
  nightmareNight: false as boolean,
  messageSound: 'none' as string,
  warning: true as boolean,
  timeZone: 'Europe/Moscow' as string,
});
export const useSettingsStore = defineStore('settings', () => {
  const timeZoneCookie = useCookie<string>('settings_timezone', { path: '/', sameSite: 'lax', maxAge: 7_776_000 });
  const themeCookie = useCookie<string>('settings_theme', { path: '/', sameSite: 'lax', maxAge: 7_776_000 });
  const compactCookie = useCookie<boolean>('settings_compact', { path: '/', sameSite: 'lax', maxAge: 7_776_000 });
  const snowCookie = useCookie<boolean>('settings_snow', { path: '/', sameSite: 'lax', maxAge: 315_360_000 });
  const nightmareNightCookie = useCookie<boolean | string>('settings_nightmare_night', { path: '/', sameSite: 'lax', maxAge: 2_592_000 });
  const messageSoundCookie = useCookie<string>('settings_message_sound', { path: '/', sameSite: 'lax', maxAge: 7_776_000 });
  const warningCookie = useCookie<boolean | string>('settings_warning', { path: '/', sameSite: 'lax', maxAge: 21_600 });
  const route = useRoute();
  const storeState = reactive(state());
  function initialize() {
    const isOBS = route.query.style === 'obs';
    (storeState.isOBS = isOBS);
    (storeState.isPlay = !!route.query.play);
    if (!isOBS) {
      const timeZone = timeZoneCookie.value;
      if (timeZone) (storeState.timeZone = timeZone);
    }
    const theme = themeCookie.value;
    const compact = compactCookie.value;
    // const snow = snowCookie.value;
    const nightmareNight = nightmareNightCookie.value;
    const messageSound = messageSoundCookie.value;
    const warning = warningCookie.value;
    if (theme) setTheme(theme);
    if (compact !== null && compact !== undefined) setCompact(compact);
    // if (snow !== null && snow !== undefined) dispatch('setSnow', snow);
    if (nightmareNight !== null && nightmareNight !== undefined) {
      (storeState.nightmareNight = nightmareNight === true || nightmareNight === 'true');
    }
    if (messageSound) (storeState.messageSound = messageSound);
    if (warning !== null && warning !== undefined) (storeState.warning = warning === true || warning === 'true');
  }

  function detectTimeZone() {
    if (storeState.isOBS) {
      return;
    }

    const timeZone = DateTime.local().zoneName;
    setTimeZone(timeZone);
  }

  function setTheme(payload: string) {
    themeCookie.value = payload;
    (storeState.theme = payload);
  }

  function setCompact(payload: boolean) {
    compactCookie.value = payload;
    (storeState.compact = payload);
  }

  function setSnow(payload: boolean) {
    snowCookie.value = payload;
    (storeState.snow = payload);
  }

  function setNightmareNight(payload: boolean) {
    nightmareNightCookie.value = payload;
    (storeState.nightmareNight = payload);
  }

  function setMessageSound(payload: string) {
    messageSoundCookie.value = payload;
    (storeState.messageSound = payload);
  }

  function setTimeZone(payload: string) {
    timeZoneCookie.value = payload;
    (storeState.timeZone = payload);
  }

  function setWarning(payload: boolean) {
    warningCookie.value = payload;
    (storeState.warning = payload);
  }
  return {
    ...toRefs(storeState),
    initialize,
    detectTimeZone,
    setTheme,
    setCompact,
    setSnow,
    setNightmareNight,
    setMessageSound,
    setTimeZone,
    setWarning,
  };
});
