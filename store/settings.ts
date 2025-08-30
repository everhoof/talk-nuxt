import { actionTree, getterTree, mutationTree } from 'typed-vuex';
import { Context } from '@nuxt/types';
import { DateTime } from 'luxon';

export const namespaced = true;

export const state = () => ({
  isOBS: false as boolean,
  isPlay: false as boolean,
  theme: 'dark' as string,
  compact: true as boolean,
  snow: false as boolean,
  messageSound: 'none' as string,
  warning: true as boolean,
  timeZone: 'Europe/Moscow' as string,
});

export type SettingsState = ReturnType<typeof state>;

export const mutations = mutationTree(state, {
  SET_IS_OBS: (_state, payload: boolean) => (_state.isOBS = payload),
  SET_IS_PLAY: (_state, payload: boolean) => (_state.isPlay = payload),
  SET_THEME: (_state, payload: string) => (_state.theme = payload),
  SET_COMPACT: (_state, payload: boolean) => (_state.compact = payload),
  SET_SNOW: (_state, payload: boolean) => (_state.snow = payload),
  SET_MESSAGE_SOUND: (_state, payload: string) => (_state.messageSound = payload),
  SET_TIMEZONE: (_state, payload: string) => (_state.timeZone = payload),
  SET_WARNING: (_state, payload: boolean) => (_state.warning = payload),
});

export const getters = getterTree(state, {});

export const actions = actionTree(
  { state, mutations, getters },
  {
    nuxtServerInit({ dispatch, commit }, context: Context) {
      const isOBS = context.query.style === 'obs';
      commit('SET_IS_OBS', isOBS);
      commit('SET_IS_PLAY', !!context.query.play);

      if (!isOBS) {
        const timeZone = context.app.$cookies.get('settings_timezone');
        if (timeZone) commit('SET_TIMEZONE', timeZone);
      }

      const theme = context.app.$cookies.get('settings_theme');
      const compact = context.app.$cookies.get('settings_compact');
      // const snow = context.app.$cookies.get('settings_snow');
      const messageSound = context.app.$cookies.get('settings_message_sound');
      const warning = context.app.$cookies.get('settings_warning');

      if (theme) dispatch('setTheme', theme);
      if (compact !== null && compact !== undefined) dispatch('setCompact', compact);
      // if (snow !== null && snow !== undefined) dispatch('setSnow', snow);
      if (messageSound) commit('SET_MESSAGE_SOUND', messageSound);
      if (warning !== null && warning !== undefined) commit('SET_WARNING', warning === 'true');
    },

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    nuxtClientInit({ state, dispatch }, { app }: Context) {
      if (!state.isOBS) {
        const timeZone = DateTime.local().zoneName;
        dispatch('setTimeZone', timeZone);
      }
    },

    setTheme({ commit }, payload: string) {
      this.app.$cookies.set('settings_theme', payload, {
        path: '/',
        sameSite: 'lax',
        maxAge: 86400 * 90,
      });
      commit('SET_THEME', payload);
    },

    setCompact({ commit }, payload: boolean) {
      this.app.$cookies.set('settings_compact', payload, {
        path: '/',
        sameSite: 'lax',
        maxAge: 86400 * 90,
      });
      commit('SET_COMPACT', payload);
    },

    setSnow({ commit }, payload: boolean) {
      this.app.$cookies.set('settings_snow', payload, {
        path: '/',
        sameSite: 'lax',
        maxAge: 86400 * 3650,
      });
      commit('SET_SNOW', payload);
    },

    setMessageSound({ commit }, payload: string) {
      this.app.$cookies.set('settings_message_sound', payload, {
        path: '/',
        sameSite: 'lax',
        maxAge: 86400 * 90,
      });
      commit('SET_MESSAGE_SOUND', payload);
    },

    setTimeZone({ commit }, payload: string) {
      this.app.$cookies.set('settings_timezone', payload, {
        path: '/',
        sameSite: 'lax',
        maxAge: 86400 * 90,
      });
      commit('SET_TIMEZONE', payload);
    },

    setWarning({ commit }, payload: boolean) {
      this.app.$cookies.set('settings_warning', payload, {
        path: '/',
        sameSite: 'lax',
        maxAge: 86400 * 6,
      });
      commit('SET_WARNING', payload);
    },
  },
);
