<template>
  <b-modal @close="$emit('close', $event)">
    <template #title>Регистрация</template>
    <template #default>
      <div class="settings-modal">
        <b-switch id="settings_theme" :checked="dark" @update:checked="setTheme">
          {{ $t('modals.settings.dark_theme') }}
        </b-switch>
        <b-switch id="settings_compact" :checked="compact" @update:checked="setCompact">
          {{ $t('modals.settings.compact_view') }}
        </b-switch>
        <b-switch v-if="false" id="settings_snow" :checked="snow" @update:checked="setSnow">
          {{ $t('modals.settings.snow') }}
        </b-switch>
        <div class="settings-modal__row">
          <span class="settings-modal__label">{{ $t('modals.settings.message_sound') }}:</span>
          <b-select :items="messageSoundOptions" :value="messageSoundIndex" @input="setMessageSound" />
        </div>
      </div>
    </template>
  </b-modal>
</template>

<script lang="ts">
import { Component, Vue } from 'nuxt-property-decorator';
import BSwitch from '~/components/switch/switch.vue';
import BModal from '~/components/modals/modal/modal.vue';
import BSelect from '~/components/select/select.vue';

@Component({
  name: 'b-settings-modal',
  components: { BSelect, BModal, BSwitch },
})
export default class SettingsModal extends Vue {
  get messageSounds(): string[] {
    return ['none', 'sound_1', 'sound_2'];
  }

  get messageSoundIndex(): number {
    const index = this.messageSounds.findIndex((sound) => sound === this.$accessor.settings.messageSound);
    if (index === -1) return 0;
    return index;
  }

  get messageSoundOptions(): string[] {
    return this.messageSounds.map((sound) => {
      return this.$t(`modals.settings.message_sound_options.${sound}`).toString();
    });
  }

  get dark(): boolean {
    return this.$accessor.settings.theme === 'dark';
  }

  get compact(): boolean {
    return this.$accessor.settings.compact;
  }

  get snow(): boolean {
    return this.$accessor.settings.snow;
  }

  setTheme(value: boolean) {
    this.$accessor.settings.setTheme(value ? 'dark' : 'light');
  }

  setCompact(value: boolean) {
    this.$accessor.settings.setCompact(value);
  }

  setSnow(value: boolean) {
    this.$accessor.settings.setSnow(value);
  }

  setMessageSound(index: number) {
    const id = this.messageSounds[index];
    this.$accessor.settings.setMessageSound(id);
  }
}
</script>

<style lang="stylus" src="./settings-modal.styl" />
