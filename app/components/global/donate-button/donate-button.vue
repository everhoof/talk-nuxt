<template>
  <!-- begin .donate-button-->
  <a
    aria-label="Поддержать радио"
    :href="link"
    target="_blank"
    rel="noopener noreferrer"
    class="donate-button"
    @click.prevent="onClick"
  >
    <svg-icon name="giftcard" class="donate-button__icon" />
  </a>
  <!-- end .donate-button-->
</template>

<script setup lang="ts">
import { computed } from 'vue';

defineOptions({ name: 'BDonateButton' });

const link = computed((): string => {
  return 'https://www.donationalerts.com/r/everhoof';
});

function onClick(): void {
  window.open(link.value, 'Отправить пожертвование', 'width=450px,height=600px,resizable=1');
}
</script>

<style lang="scss" src="./donate-button.scss">
</style>
