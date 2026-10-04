<template>
  <div class="poll-multiple-choice">
    <label v-for="option in options" :key="option.id" class="poll-multiple-choice__choice">
      <input v-model="selectedOptionIds" type="checkbox" :value="option.id" :disabled="disabled" />
      <span>{{ option.label }}</span>
    </label>
    <b-button
      v-if="showSubmit"
      class="poll-multiple-choice__submit"
      small
      :disabled="disabled || !selectedOptionIds.length"
      @click="$emit('vote', selectedOptionIds)"
    >
      {{ $t('poll.submit_vote') }}
    </b-button>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'nuxt-property-decorator';
import BButton from '~/components/button/button.vue';
import { PollPartsFragment } from '~/graphql/schema';

@Component({
  name: 'b-poll-multiple-choice',
  components: {
    BButton,
  },
})
export default class PollMultipleChoice extends Vue {
  @Prop({
    type: Array,
    required: true,
  })
  readonly options!: PollPartsFragment['options'];

  @Prop({
    type: Array,
    required: true,
  })
  readonly value!: number[];

  @Prop({
    type: Boolean,
    default: false,
  })
  readonly disabled!: boolean;

  @Prop({
    type: Boolean,
    default: false,
  })
  readonly showSubmit!: boolean;

  get selectedOptionIds(): number[] {
    return this.value;
  }

  set selectedOptionIds(value: number[]) {
    this.$emit('input', value);
  }
}
</script>

<style lang="stylus" src="./poll-multiple-choice.styl" />
