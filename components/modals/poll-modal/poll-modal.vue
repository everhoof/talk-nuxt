<template>
  <b-modal @close="$emit('close', $event)">
    <template #title>{{ $t('poll.create') }}</template>
    <form class="poll-modal" @submit.prevent="createPoll">
      <label class="poll-modal__label" for="poll-question">{{ $t('poll.question') }}</label>
      <input
        id="poll-question"
        ref="questionInput"
        v-model="question"
        class="poll-modal__input"
        :placeholder="$t('poll.question_placeholder')"
        maxlength="300"
        required
        :disabled="busy"
      />
      <p class="poll-modal__hint">{{ $t('poll.settings_hint') }}</p>
      <div v-for="(_option, index) in options" :key="index" class="poll-modal__option">
        <label :for="`poll-option-${index}`" class="poll-modal__label">
          {{ $t('poll.option', { number: index + 1 }) }}
        </label>
        <div class="poll-modal__option-input">
          <input
            :id="`poll-option-${index}`"
            v-model="options[index]"
            class="poll-modal__input"
            :placeholder="$t('poll.option', { number: index + 1 })"
            maxlength="100"
            required
            :disabled="busy"
          />
          <button
            v-if="options.length > 2"
            type="button"
            class="poll-modal__remove"
            :aria-label="$t('poll.remove_option', { number: index + 1 })"
            :disabled="busy"
            @click="options.splice(index, 1)"
          >
            <svg-icon name="close" />
          </button>
        </div>
      </div>
      <b-button type="button" small :disabled="busy || options.length >= 10" @click="options.push('')">
        {{ $t('poll.add_option') }}
      </b-button>
      <p v-if="duplicateOptions" class="poll-modal__error" role="alert">{{ $t('poll.duplicate_options') }}</p>
      <p v-if="error" class="poll-modal__error" role="alert">{{ error }}</p>
      <div class="poll-modal__submit">
        <b-button class="poll-modal__publish" type="submit" width-full :disabled="busy || !valid">
          {{ $t(busy ? 'poll.creating' : 'poll.publish') }}
        </b-button>
      </div>
    </form>
  </b-modal>
</template>

<script lang="ts">
import { Component, Ref, Vue } from 'nuxt-property-decorator';
import BModal from '~/components/modals/modal/modal.vue';
import BButton from '~/components/button/button.vue';
import CreatePoll from '~/graphql/mutations/create-poll.graphql';
import { CreatePollMutation, CreatePollMutationVariables } from '~/graphql/schema';
import { Message } from '~/types/message';

@Component({ name: 'b-poll-modal', components: { BModal, BButton } })
export default class PollModal extends Vue {
  @Ref() questionInput!: HTMLInputElement;
  question = '';
  options = ['', ''];
  busy = false;
  error = '';

  mounted(): void {
    if (!this.$accessor.auth.loggedIn || !this.$accessor.auth.can.createOwn('poll').granted) {
      this.$emit('close');
      return;
    }
    this.questionInput.focus();
  }

  get valid(): boolean {
    return (
      !!this.question.trim() &&
      this.question.length <= 300 &&
      this.options.length >= 2 &&
      this.options.length <= 10 &&
      this.options.every((option) => !!option.trim() && option.length <= 100) &&
      !this.duplicateOptions
    );
  }

  get duplicateOptions(): boolean {
    const options = this.options.map((option) => option.trim().toLowerCase()).filter(Boolean);
    return new Set(options).size !== options.length;
  }

  async createPoll(): Promise<void> {
    if (this.busy || !this.valid) return;
    this.busy = true;
    this.error = '';
    try {
      const { data } = await this.$apollo.mutate<CreatePollMutation, CreatePollMutationVariables>({
        mutation: CreatePoll,
        variables: { question: this.question.trim(), options: this.options.map((option) => option.trim()) },
      });
      if (!data) throw new Error('No poll returned');
      this.$accessor.messages.UPDATE_MESSAGE(new Message(data.createPoll));
      this.$nuxt.$emit('force-scroll');
      this.$emit('close');
    } catch (_error) {
      this.error = this.$t('poll.create_error').toString();
    } finally {
      this.busy = false;
    }
  }
}
</script>

<style lang="stylus" src="./poll-modal.styl" />
