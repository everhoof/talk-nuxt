<template>
  <div class="pinned-polls-indicator" aria-hidden="true">
    <div class="pinned-polls-indicator__track" :style="{ transform: `translateY(-${offset}px)` }">
      <span
        v-for="index in count"
        :key="index"
        class="pinned-polls-indicator__segment"
        :class="{ 'pinned-polls-indicator__segment_active': index - 1 === selectedIndex }"
        :style="{ height: `${segmentHeight}px` }"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'nuxt-property-decorator';

@Component({ name: 'b-pinned-polls-indicator' })
export default class PinnedPollsIndicator extends Vue {
  @Prop({ type: Number, required: true }) readonly count!: number;
  @Prop({ type: Number, required: true }) readonly selectedIndex!: number;

  get segmentHeight(): number {
    const visibleCount = Math.min(this.count, 3);
    return visibleCount ? (40 - (visibleCount - 1) * 3) / visibleCount : 40;
  }

  get offset(): number {
    const step = this.segmentHeight + 3;
    const totalHeight = this.count * step - 3;
    const centeredOffset = this.selectedIndex * step - (40 - this.segmentHeight) / 2;
    return Math.max(0, Math.min(centeredOffset, totalHeight - 40));
  }
}
</script>

<style lang="stylus" src="./pinned-polls-indicator.styl" />
