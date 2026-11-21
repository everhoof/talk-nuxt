<template>
  <!-- begin .warning-->
  <div class="warning">
    <div class="warning__text">
      {{ t('warning') }}
    </div>
    <button type="button" class="warning__button" @click="onClose">
      <svg-icon name="close" class="warning__button-icon" />
    </button>
  </div>
  <!-- end .warning-->
</template>

<script setup lang="ts">
const { t } = useI18n();
defineOptions({ name: 'BWarning' });

const settingsStore = useSettingsStore();

function onClose(): void {
  settingsStore.setWarning(false);
}
</script>

<style lang="scss" src="./warning.scss">
</style>
