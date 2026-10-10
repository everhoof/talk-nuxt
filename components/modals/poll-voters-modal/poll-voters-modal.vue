<template>
  <b-modal
    trap-focus
    role="dialog"
    aria-modal="true"
    :aria-label="$t('poll.voters')"
    :close-label="$t('poll.close_dialog')"
    @close="close"
  >
    <template #title>{{ $t('poll.voters') }}</template>
    <template #default>
      <div class="poll-voters">
        <div class="poll-voters__body scrollbar">
          <p class="poll-voters__question">{{ poll.question }}</p>
          <div class="poll-voters__summary">
            <p class="poll-voters__hint" role="status">
              {{ $t('poll.voters_total', { count: poll.totalVotes }) }}
            </p>
            <p v-if="poll.allowMultiple && poll.totalVotes" class="poll-voters__hint">
              {{ $t('poll.voters_multiple') }}
            </p>
          </div>
          <p v-if="!poll.totalVotes" class="poll-voters__hint">{{ $t('poll.voters_empty') }}</p>
          <template v-else>
            <section
              v-for="group in groups"
              :key="group.id"
              class="poll-voters-group"
              :aria-labelledby="`poll-voters-answer-${group.id}`"
            >
              <h3 :id="`poll-voters-answer-${group.id}`" class="poll-voters-group__heading">
                <span>{{ group.label }}</span>
                <span class="poll-voters-group__count">{{ group.voters.length }}</span>
              </h3>
              <ul v-if="group.voters.length" class="poll-voters-group__list">
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
                      <span v-if="voter.id === currentUserId" class="poll-voter__marker">
                        {{ $t('poll.you') }}
                      </span>
                    </div>
                    <time v-if="voter.votedAt" class="poll-voter__time" :datetime="voter.votedAt">
                      {{ formatVoteTime(voter.votedAt) }}
                    </time>
                  </div>
                </li>
              </ul>
              <p v-else class="poll-voters__hint">{{ $t('poll.option_empty') }}</p>
            </section>
          </template>
        </div>
      </div>
    </template>
  </b-modal>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'nuxt-property-decorator';
import { DateTime } from 'luxon';
import BModal from '~/components/modals/modal/modal.vue';
import BPollVoterAvatar from '~/components/poll-voter-avatar/poll-voter-avatar.vue';
import { PollPartsFragment } from '~/graphql/schema';

@Component({ name: 'b-poll-voters-modal', components: { BModal, BPollVoterAvatar } })
export default class PollVotersModal extends Vue {
  @Prop({ type: Object, required: true }) poll!: PollPartsFragment;
  @Prop({ type: Number }) currentUserId!: number | null;

  get groups() {
    return this.poll.options.map((option) => {
      const voters = this.poll.voters.filter((voter) => voter.optionIds.includes(option.id));

      return { ...option, voters };
    });
  }

  close(): void {
    this.$emit('close');
  }

  formatVoteTime(value: string): string {
    return DateTime.fromISO(value)
      .setLocale(this.$i18n.locale)
      .toLocaleString(DateTime.DATETIME_SHORT_WITH_SECONDS);
  }
}
</script>

<style lang="stylus" src="./poll-voters-modal.styl" />
