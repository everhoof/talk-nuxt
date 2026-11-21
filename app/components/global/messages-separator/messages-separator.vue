<template>
  <!-- begin .messages-separator-->
  <div class="messages-separator">
    <span class="messages-separator__date">
      <template v-if="settingsStore.nightmareNight && !settingsStore.isOBS">
        <img
          class="messages-separator__pumpkin"
          src="/nightmare-night/pumpkin.svg"
          width="16"
          height="16"
          alt=""
          draggable="false"
          aria-hidden="true"
        />
      </template>
      {{ date }}
    </span>
  </div>
  <!-- end .messages-separator-->
</template>

<script setup lang="ts">
import type { MessagesSeparatorProps } from './index';
import { computed } from 'vue';

import { DateTime } from 'luxon';

defineOptions({ name: 'BMessagesSeparator' });

const settingsStore = useSettingsStore();

const props = defineProps<MessagesSeparatorProps>();

const date = computed((): string => {
  return DateTime.fromISO(props.message.createdAt)
    .setZone(settingsStore.timeZone)
    .toFormat('dd LLLL yyyy');
});
</script>

<style lang="scss" src="./messages-separator.scss">
</style>
