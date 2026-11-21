<template>
  <b-modal @close="$emit('close', $event)">
    <template #title>
      {{ t('modals.settings.title') }}
    </template>
    <template #default>
      <div class="settings-modal">
        <ui-switch id="settings_theme" :checked="dark" @update:checked="setTheme">
          {{ t('modals.settings.dark_theme') }}
        </ui-switch>
        <ui-switch id="settings_compact" :checked="compact" @update:checked="setCompact">
          {{ t('modals.settings.compact_view') }}
        </ui-switch>
        <ui-switch id="settings_nightmare_night" :checked="nightmareNight" @update:checked="setNightmareNight">
          {{ t('modals.settings.nightmare_night') }}
        </ui-switch>
        <!-- eslint-disable vue/no-constant-condition -- Keep this existing feature disabled. -->
        <template v-if="false">
          <ui-switch
            id="settings_snow"
            :checked="snow"
            @update:checked="setSnow"
          >
            {{ t('modals.settings.snow') }}
          </ui-switch>
        </template>
        <div class="settings-modal__row">
          <span class="settings-modal__label">{{ t('modals.settings.message_sound') }}:</span>
          <ui-select
            :items="messageSoundOptions"
            :model-value="messageSoundIndex"
            @update:model-value="setMessageSound"
          />
        </div>
      </div>
    </template>
  </b-modal>
</template>

<script setup lang="ts">
import type { SettingsModalEmits } from './index';
import { computed } from 'vue';

defineOptions({ name: 'BSettingsModal' });

const settingsStore = useSettingsStore();
const { t } = useI18n();

defineEmits<SettingsModalEmits>();

const messageSounds = computed((): string[] => {
  return ['none', 'sound_1', 'sound_2'];
});

const messageSoundIndex = computed((): number => {
  const index = messageSounds.value.indexOf(settingsStore.messageSound);
  if (index === -1) return 0;
  return index;
});

const messageSoundOptions = computed((): string[] => {
  return messageSounds.value.map((sound) => {
    return t(`modals.settings.message_sound_options.${sound}`);
  });
});

const dark = computed((): boolean => {
  return settingsStore.theme === 'dark';
});

const compact = computed((): boolean => {
  return settingsStore.compact;
});

const snow = computed((): boolean => {
  return settingsStore.snow;
});

const nightmareNight = computed((): boolean => {
  return settingsStore.nightmareNight;
});

function setNightmareNight(value: boolean) {
  settingsStore.setNightmareNight(value);
}

function setTheme(value: boolean) {
  settingsStore.setTheme(value ? 'dark' : 'light');
}

function setCompact(value: boolean) {
  settingsStore.setCompact(value);
}

function setSnow(value: boolean) {
  settingsStore.setSnow(value);
}

function setMessageSound(index: number) {
  const id = messageSounds.value[index];
  settingsStore.setMessageSound(id);
}
</script>

<style lang="scss" src="./settings-modal.scss">
</style>
