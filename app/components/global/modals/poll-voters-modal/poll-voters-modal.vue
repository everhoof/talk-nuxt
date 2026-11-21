<template>
  <b-modal

    role="dialog"
    aria-modal="true"
    :aria-label="t('poll.voters')"
    :close-label="t('poll.close_dialog')"
    @close="close"
  >
    <template #title>
      {{ t('poll.voters') }}
    </template>
    <template #default>
      <div class="poll-voters">
        <div class="poll-voters__body scrollbar">
          <p class="poll-voters__question"><b-formatted-poll-text :content="poll.question" /></p>
          <div class="poll-voters__summary">
            <p class="poll-voters__hint" role="status">
              {{ t('poll.voters_total', { count: poll.totalVotes }) }}
            </p>
            <template v-if="poll.allowMultiple && poll.totalVotes">
              <p class="poll-voters__hint">
                {{ t('poll.voters_multiple') }}
              </p>
            </template>
          </div>
          <template v-if="!poll.totalVotes">
            <p class="poll-voters__hint">{{ t('poll.voters_empty') }}</p>
          </template>
          <template v-else>
            <section
              v-for="group in groups"
              :key="group.id"
              class="poll-voters-group"
              :aria-labelledby="`poll-voters-answer-${group.id}`"
            >
              <h3 :id="`poll-voters-answer-${group.id}`" class="poll-voters-group__heading">
                <b-formatted-poll-text :content="group.label" />
                <span class="poll-voters-group__count">{{ group.voters.length }}</span>
              </h3>
              <template v-if="group.voters.length">
                <ul class="poll-voters-group__list">
                  <li v-for="voter in group.voters" :key="voter.id" class="poll-voter">
                    <b-poll-voter-avatar
                      :username="voter.username"
                      :user-id="voter.id"
                      :src="voter.avatarUrl"
                      aria-hidden="true"
                    />
                    <div class="poll-voter__details">
                      <div class="poll-voter__identity">
                        <span class="poll-voter__name">{{ voter.username }}</span>
                        <template v-if="voter.id === currentUserId">
                          <span class="poll-voter__marker">
                            {{ t('poll.you') }}
                          </span>
                        </template>
                      </div>
                      <template v-if="voter.votedAt">
                        <time class="poll-voter__time" :datetime="voter.votedAt">
                          {{ formatVoteTime(voter.votedAt) }}
                        </time>
                      </template>
                    </div>
                  </li>
                </ul>
              </template>
              <template v-else>
                <p class="poll-voters__hint">{{ t('poll.option_empty') }}</p>
              </template>
            </section>
          </template>
        </div>
      </div>
    </template>
  </b-modal>
</template>

<script setup lang="ts">
import type {
  PollVotersModalProps,
  PollVotersModalEmits,
} from './index';
import { computed } from 'vue';

import { DateTime } from 'luxon';

const { t, locale } = useI18n();

defineOptions({ name: 'BPollVotersModal' });

const props = defineProps<PollVotersModalProps>();

const emit = defineEmits<PollVotersModalEmits>();

const groups = computed(() => {
  return props.poll.options.map((option) => {
    const voters = props.poll.voters.filter((voter) => voter.optionIds.includes(option.id));
    return { ...option, voters };
  });
});

function close(): void {
  emit('close');
}

function formatVoteTime(value: string): string {
  return DateTime.fromISO(value).setLocale(locale.value)
    .toLocaleString(DateTime.DATETIME_SHORT_WITH_SECONDS);
}
</script>

<style lang="scss" src="./poll-voters-modal.scss">
</style>
