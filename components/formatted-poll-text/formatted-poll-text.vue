<template>
  <span class="formatted-poll-text" v-html="content" />
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'nuxt-property-decorator';

@Component({ name: 'b-formatted-poll-text' })
export default class FormattedPollText extends Vue {
  @Prop({ type: String, required: true }) readonly content!: string;
}
</script>

<style lang="stylus">
.formatted-poll-text strong
	font-weight bolder
</style>
