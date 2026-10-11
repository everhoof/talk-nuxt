<template>
  <!-- begin .switch-->
  <div
    class="switch"
    :class="{
      switch_with_margin: margin,
    }"
  >
    <input
      :id="id"
      v-model="checkedSynced"
      class="switch__input"
      type="checkbox"
      role="switch"
      :disabled="disabled"
    />
    <label :for="id" class="switch__label">
      <slot />
    </label>
  </div>
  <!-- end .switch-->
</template>

<script lang="ts">
import { Component, Prop, PropSync, Vue } from 'nuxt-property-decorator';

@Component({
  name: 'b-switch',
})
export default class Switch extends Vue {
  @Prop({ type: String, required: true }) id!: string;
  @Prop({ type: String }) label!: string;
  @Prop({ type: Boolean, default: false }) disabled!: boolean;
  @Prop({ type: Boolean }) margin!: boolean;
  @PropSync('checked', { required: false, type: Boolean })
  checkedSynced!: boolean;
}
</script>

<style lang="stylus" src="./switch.styl" />
