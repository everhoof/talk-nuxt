<template>
  <div class="poll-single-choice">
    <button
      v-for="option in options"
      :key="option.id"
      type="button"
      class="poll-single-choice__option"
      :disabled="disabled"
      @click="$emit('vote', [option.id])"
    >
      <b-formatted-poll-text :content="option.label" />
    </button>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'nuxt-property-decorator';
import { PollPartsFragment } from '~/graphql/schema';
import BFormattedPollText from '~/components/formatted-poll-text/formatted-poll-text.vue';

@Component({
  name: 'b-poll-single-choice',
  components: { BFormattedPollText },
})
export default class PollSingleChoice extends Vue {
  @Prop({
    type: Array,
    required: true,
  })
  readonly options!: PollPartsFragment['options'];

  @Prop({
    type: Boolean,
    default: false,
  })
  readonly disabled!: boolean;
}
</script>

<style lang="stylus" src="./poll-single-choice.styl" />
