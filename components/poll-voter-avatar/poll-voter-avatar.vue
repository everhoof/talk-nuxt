<template>
  <b-user-avatar class="poll-voter-avatar" :username="username" :user-id="userId" :src="src" :tiny="tiny" />
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'nuxt-property-decorator';
import BUserAvatar from '~/components/user-avatar/user-avatar.vue';

@Component({ name: 'b-poll-voter-avatar', components: { BUserAvatar } })
export default class PollVoterAvatar extends Vue {
  @Prop({ type: String, required: true }) username!: string;
  @Prop({ type: Number }) userId!: number | undefined;
  @Prop({ type: String, default: null }) src!: string | null;
  @Prop({ type: Boolean, default: false }) tiny!: boolean;
}
</script>
