<template>
  <b-poll-multiple-choice
    v-if="allowMultiple"
    :value="value"
    :options="options"
    :disabled="disabled"
    :show-submit="showSubmit"
    @input="$emit('input', $event)"
    @vote="$emit('vote', $event)"
  />
  <b-poll-single-choice v-else :options="options" :disabled="disabled" @vote="$emit('vote', $event)" />
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'nuxt-property-decorator';
import BPollSingleChoice from '~/components/poll-single-choice/poll-single-choice.vue';
import BPollMultipleChoice from '~/components/poll-multiple-choice/poll-multiple-choice.vue';
import { PollPartsFragment } from '~/graphql/schema';

@Component({
  name: 'b-poll-choices',
  components: {
    BPollSingleChoice,
    BPollMultipleChoice,
  },
})
export default class PollChoices extends Vue {
  @Prop({
    type: Boolean,
    default: false,
  })
  readonly allowMultiple!: boolean;

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
}
</script>
