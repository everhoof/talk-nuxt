<template>
  <div
    :class="classNames"
    :aria-label="selectedAnswerLabel"
  >
    <div class="poll-result-item__label">
      <b-formatted-poll-text class="poll-result-item__answer" :content="option.label" />
      <div class="poll-result-item__meta">
        <template v-if="isAnonymous">
          <span class="poll-vote-count">
            <span class="poll-vote-count__number">{{ voteCount }}</span>
            <span>{{ voteLabel }}</span>
          </span>
        </template>
        <template v-else-if="voters.length">
          <b-poll-voters-preview
            :voters="voters"
            :label="t('poll.option_voters', {
              label: answerText,
              count: option.votes,
            })"
            :disabled="busy"
            @click="$emit('voters')"
          />
        </template>
        <span class="poll-result-item__count">{{ percent }}%</span>
      </div>
    </div>
    <div class="poll-result-item__bar" aria-hidden="true">
      <div class="poll-result-item__fill" :style="{ width: `${percent}%` }" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type {
  PollResultItemProps,
  PollResultItemEmits,
} from './index';
import {
  flag,
  useBMC,
} from '@rhapsodic/bem-classnames-vue';
import { computed } from 'vue';
import { pollText } from '~/tools/poll-formatting';

const { t, locale } = useI18n();

defineOptions({ name: 'BPollResultItem' });

const props = withDefaults(defineProps<PollResultItemProps>(), {
  isAnonymous: false,
  voters: () => [],
  busy: false,
  totalVotes: null,
  selected: false,
});

const classNames = useBMC(props, 'poll-result-item', { selected: flag('state', 'selected') });

defineEmits<PollResultItemEmits>();

const voteCount = computed((): number => {
  return props.option.votes || 0;
});

const answerText = computed(() => pollText(props.option.label));

const selectedAnswerLabel = computed((): string | undefined => {
  if (!props.selected) {
    return undefined;
  }
  const votedLabel = t('poll.voted');
  return `${answerText.value}: ${votedLabel}, ${percent.value}%`;
});

const voteLabel = computed((): string => {
  const count = voteCount.value;
  if (locale.value !== 'ru') {
    if (count === 1) {
      return 'vote';
    }
    return 'votes';
  }
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;
  if (lastDigit === 1 && lastTwoDigits !== 11) {
    return 'голос';
  }
  const isEndsInTwoToFour = lastDigit >= 2 && lastDigit <= 4;
  const isEndsInTeen = lastTwoDigits >= 12 && lastTwoDigits <= 14;
  if (isEndsInTwoToFour && !isEndsInTeen) {
    return 'голоса';
  }
  return 'голосов';
});

const percent = computed((): number => {
  if (!props.totalVotes) {
    return 0;
  }
  const percentage = (voteCount.value * 100) / props.totalVotes;
  return Math.round(percentage);
});
</script>

<style lang="scss" src="./poll-result-item.scss">
</style>
