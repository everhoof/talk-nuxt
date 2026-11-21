<template>
  <!-- begin .tile-->
  <div class="tile">
    <slot />
  </div>
  <!-- end .tile-->
</template>

<script setup lang="ts">
import type { TileSlots } from './index';

defineOptions({ name: 'UiTile' });

defineSlots<TileSlots>();
</script>

<style lang="scss" src="./tile.scss">
</style>
