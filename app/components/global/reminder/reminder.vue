<template>
  <!-- begin .reminder-->
  <div v-show="show" class="reminder">
    <div class="reminder__content">
      <div class="reminder__text">
        <slot />
      </div>
      <template v-if="$slots.button">
        <button
          type="button"
          class="reminder__button"
          @click="$emit('click')"
        >
          <slot name="button" />
        </button>
      </template>
    </div>
    <button type="button" class="reminder__close-button" @click="close()">
      <svg-icon name="close" class="reminder__icon" />
    </button>
  </div>
  <!-- end .reminder-->
</template>

<script setup lang="ts">
import type {
  ReminderProps,
  ReminderEmits,
  ReminderSlots,
} from './index';
import { computed } from 'vue';

defineOptions({ name: 'BReminder' });

const authStore = useAuthStore();
const modalsStore = useModalsStore();

const props = defineProps<ReminderProps>();

defineEmits<ReminderEmits>();

const show = computed((): boolean => {
  const userId = authStore.user?.id;
  if (!userId) return false;
  const reminder = modalsStore.reminders.find((entry) => entry.type === props.id && entry.userId === userId);
  return !!(reminder?.disabledAt === null);
});

function close() {
  modalsStore.removeReminder({ type: props.id, timeout: 1000 * 60 * 60 * 24 * 31 });
}

defineSlots<ReminderSlots>();
</script>

<style lang="scss" src="./reminder.scss">
</style>
