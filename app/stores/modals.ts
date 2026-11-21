import { defineStore } from 'pinia';
import {
  reactive,
  toRefs,
} from 'vue';
import type {
  ReminderTypes,
  Reminder,
} from '~/types/reminderTypes';

const state = () => ({
  reminders: [] as Reminder[],
  politicsRestrictedShowed: false,
});
export const useModalsStore = defineStore('modals', () => {
  const authStore = useAuthStore();
  const politicsCookie = useCookie<number>('politics_restricted_showed', { path: '/', sameSite: 'lax', maxAge: 86_400 * 30 });
  const storeState = reactive(state());
  function restoreReminders() {
    const storage = localStorage.getItem('reminders');
    storeState.reminders = (storage && JSON.parse(storage)) || [];
  }

  function saveReminders(payload: Reminder[]) {
    localStorage.setItem('reminders', JSON.stringify(payload));
    storeState.reminders = payload;
  }

  function setPoliticsRestrictedState(payload: boolean) {
    storeState.politicsRestrictedShowed = payload;
  }

  setPoliticsRestrictedState(Number(politicsCookie.value) === 1);

  function restorePreferences() {
    const politicsRestrictedShowed = +(politicsCookie.value ?? '0');
    setPoliticsRestrictedState(politicsRestrictedShowed === 1);
    restoreReminders();
    const userId = authStore.user?.id;
    if (!userId) return;
    storeState.reminders.forEach((reminder) => {
      if (
        reminder.disabledAt !== null
        && reminder.userId === userId
        && Date.now() > reminder.disabledAt + reminder.timeout
      ) {
        addReminder(reminder.type);
      }
    });
  }

  function addReminder(payload: ReminderTypes) {
    restoreReminders();
    const reminders: Reminder[] = JSON.parse(JSON.stringify(storeState.reminders));
    const userId = authStore.user?.id;
    if (!userId) return;
    const index = reminders.findIndex((reminder) => reminder.type === payload && reminder.userId === userId);
    if (index === -1) {
      reminders.push({
        type: payload,
        userId,
        timeout: 0,
        disabledAt: null,
      });
    } else {
      reminders[index].disabledAt = null;
      reminders[index].timeout = 0;
    }
    saveReminders(reminders);
  }

  function removeReminder({ type, timeout }: { type: ReminderTypes; timeout: number }) {
    restoreReminders();
    const reminders: Reminder[] = JSON.parse(JSON.stringify(storeState.reminders));
    const userId = authStore.user?.id;
    if (!userId) return;
    const index = reminders.findIndex((reminder) => reminder.type === type && reminder.userId === userId);
    if (index !== -1) {
      reminders[index].disabledAt = Date.now();
      reminders[index].timeout = timeout;
    }
    saveReminders(reminders);
  }

  function setPoliticsRestrictedShowed() {
    politicsCookie.value = 1;
    setPoliticsRestrictedState(true);
  }
  return {
    ...toRefs(storeState),
    restoreReminders,
    saveReminders,
    setPoliticsRestrictedState,
    restorePreferences,
    addReminder,
    removeReminder,
    setPoliticsRestrictedShowed,
  };
});
