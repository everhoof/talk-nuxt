<template>
  <div
    class="user-avatar"
    :class="{ 'user-avatar_size_tiny': tiny }"
    :style="{ '--user-avatar__accent': accent, '--user-avatar__tint': tint }"
  >
    <img v-if="src" :src="src" alt="" class="user-avatar__image" />
    <svg v-else class="user-avatar__initials" viewBox="0 0 100 100" role="img" :aria-label="initials">
      <text x="50" y="50" dy=".35em" text-anchor="middle">{{ initials }}</text>
    </svg>
    <slot />
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'nuxt-property-decorator';
import { getUserColor } from '~/tools/util';

@Component({ name: 'b-user-avatar' })
export default class UserAvatar extends Vue {
  @Prop({ type: String, required: true }) username!: string;
  @Prop({ type: Number }) userId!: number | undefined;
  @Prop({ type: String, default: null }) src!: string | null;
  @Prop({ type: Boolean, default: false }) tiny!: boolean;

  get accent(): string {
    return getUserColor(this.userId);
  }

  get tint(): string {
    const color = this.accent.slice(1);
    const red = parseInt(color.slice(0, 2), 16);
    const green = parseInt(color.slice(2, 4), 16);
    const blue = parseInt(color.slice(4, 6), 16);

    return `rgba(${red}, ${green}, ${blue}, 0.2)`;
  }

  get initials(): string {
    return Array.from(this.username).slice(0, 2).join('').toUpperCase();
  }
}
</script>

<style lang="stylus" src="./user-avatar.styl" />
