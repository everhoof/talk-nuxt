<template>
  <button
    class="poll-voters-preview"
    type="button"
    :aria-label="label"
    :disabled="disabled"
    @click="$emit('click', $event)"
  >
    <span
      v-for="voter in voters.slice(0, 3)"
      :key="voter.id"
      class="poll-voters-preview__item"
      :title="voter.username"
      aria-hidden="true"
    >
      <b-poll-voter-avatar :username="voter.username" :user-id="voter.id" :src="voter.avatarUrl" tiny />
    </span>
    <span v-if="voters.length > 3" class="poll-voters-preview__item" aria-hidden="true">
      <span class="poll-voters-preview__more">+{{ voters.length - 3 }}</span>
    </span>
  </button>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'nuxt-property-decorator';
import BPollVoterAvatar from '~/components/poll-voter-avatar/poll-voter-avatar.vue';
import { PollPartsFragment } from '~/graphql/schema';

@Component({ name: 'b-poll-voters-preview', components: { BPollVoterAvatar } })
export default class PollVotersPreview extends Vue {
  @Prop({ type: Array, required: true }) voters!: PollPartsFragment['voters'];
  @Prop({ type: String, required: true }) label!: string;
  @Prop({ type: Boolean, default: false }) disabled!: boolean;
}
</script>

<style lang="stylus" src="./poll-voters-preview.styl" />
