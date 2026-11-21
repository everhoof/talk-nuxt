<template>
  <button type="button" class="pinned-polls-summary">
    <svg-icon name="poll" class="pinned-polls-summary__icon" aria-hidden="true" />
    <span class="pinned-polls-summary__text">
      <span class="pinned-polls-summary__label">{{ t('poll.pinned') }}</span>
      <span class="pinned-polls-summary__details" aria-live="polite">
        <b-formatted-poll-text class="pinned-polls-summary__question" :content="poll.question" />
        <template v-if="endTime">
          <time class="pinned-polls-summary__deadline" :datetime="poll.endsAt ?? undefined">
            {{ t('poll.ends_at', { time: endTime }) }}
          </time>
        </template>
      </span>
    </span>
  </button>
</template>

<script setup lang="ts">
import type { PinnedPollsSummaryProps } from './index';
import { DateTime } from 'luxon';

const { t, locale } = useI18n();

defineOptions({ name: 'BPinnedPollsSummary' });
const props = defineProps<PinnedPollsSummaryProps>();

const endTime = computed(() =>
  (props.poll.endsAt
    ? DateTime.fromISO(props.poll.endsAt).setLocale(locale.value)
        .toLocaleString(DateTime.DATETIME_SHORT)
    : ''));
</script>

<style lang="scss" src="./pinned-polls-summary.scss">
</style>
