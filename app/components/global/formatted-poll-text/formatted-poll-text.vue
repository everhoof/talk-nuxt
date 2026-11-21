<template>
  <span class="formatted-poll-text" v-html="content" />
</template>

<script setup lang="ts">
import type { FormattedPollTextProps } from './index';

defineOptions({ name: 'BFormattedPollText' });
defineProps<FormattedPollTextProps>();
</script>

<style lang="scss">
.formatted-poll-text strong {
  font-weight: bolder;
}
</style>
