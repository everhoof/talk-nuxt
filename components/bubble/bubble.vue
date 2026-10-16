<template>
  <div class="bubble">
    <slot />
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'nuxt-property-decorator';

@Component({
  name: 'b-bubble',
})
export default class Bubble extends Vue {}
</script>

<style lang="stylus" scoped>
.bubble
  display: flex;
  column-gap: .1875rem;
  padding: .375rem;
  background: var(--background-secondary);
  border: 1px solid var(--background-primary);
  border-radius: .3125rem;
  box-shadow: 0 10px 6px 0 var(--shadow);
</style>
