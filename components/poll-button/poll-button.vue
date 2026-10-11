<template>
  <b-button
    :type="type"
    class="poll-button"
    :class="{ 'poll-button_variant_secondary': secondary }"
    :disabled="disabled"
    @click="$emit('click', $event)"
  >
    <slot />
  </b-button>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'nuxt-property-decorator';
import BButton from '~/components/button/button.vue';

@Component({ name: 'b-poll-button', components: { BButton } })
export default class PollButton extends Vue {
  @Prop({ type: String, default: 'button' }) type!: string;
  @Prop({ type: Boolean, default: false }) disabled!: boolean;
  @Prop({ type: Boolean, default: false }) secondary!: boolean;
}
</script>

<style lang="stylus" src="./poll-button.styl" />
