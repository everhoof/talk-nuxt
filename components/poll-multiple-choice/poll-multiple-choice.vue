<template>
  <div class="poll-multiple-choice">
    <b-checkbox
      v-for="option in options"
      :id="`${idPrefix}-option-${option.id}`"
      :key="option.id"
      class="poll-multiple-choice__choice"
      :class="{
        'poll-multiple-choice__choice_state_selected': value.includes(option.id),
        'poll-multiple-choice__choice_state_disabled': disabled,
      }"
      :value="value.includes(option.id)"
      :disabled="disabled"
      @input="select(option.id, $event)"
    >
      {{ option.label }}
    </b-checkbox>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'nuxt-property-decorator';
import BCheckbox from '~/components/checkbox/checkbox.vue';
import { PollPartsFragment } from '~/graphql/schema';

@Component({
  name: 'b-poll-multiple-choice',
  components: {
    BCheckbox,
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

  @Prop({ type: String, required: true }) readonly idPrefix!: string;

  select(id: number, selected: boolean): void {
    const ids = this.value.filter((optionId) => optionId !== id);

    if (selected) {
      ids.push(id);
    }

    this.$emit('input', ids);
  }
}
</script>

<style lang="stylus" src="./poll-multiple-choice.styl" />
