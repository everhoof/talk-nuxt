<template>
  <div class="poll-result-item">
    <div class="poll-result-item__label">
      <span>
        {{ option.label }}
        <span v-if="selected">✓</span>
      </span>
      <span>{{ percent }}% · {{ option.votes }}</span>
    </div>
    <div class="poll-result-item__bar">
      <div
        class="poll-result-item__fill"
        :style="{
          width: `${percent}%`,
        }"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'nuxt-property-decorator';
import { PollPartsFragment } from '~/graphql/schema';

@Component({
  name: 'b-poll-result-item',
})
export default class PollResultItem extends Vue {
  @Prop({
    type: Object,
    required: true,
  })
  readonly option!: PollPartsFragment['options'][number];

  @Prop({
    type: Number,
    default: null,
  })
  readonly totalVotes!: number | null;

  @Prop({
    type: Boolean,
    default: false,
  })
  readonly selected!: boolean;

  get percent(): number {
    if (!this.totalVotes) {
      return 0;
    }

    const optionVotes = this.option.votes || 0;
    const percentage = (optionVotes * 100) / this.totalVotes;

    return Math.round(percentage);
  }
}
</script>

<style lang="stylus" src="./poll-result-item.styl" />
