<template>
  <!-- begin .message-img-->
  <img
    class="message-img"
    :src="picture.m.link"
    alt=""
    :height="displayDimensions.height"
    :width="displayDimensions.width"
    @click="openPicture"
    role="button"
    tabindex="0"
    @keydown.enter.prevent="openPicture"
    @keydown.space.prevent="openPicture"
    aria-label="Открыть изображение"
  >
  <!-- end .message-img-->
</template>

<script setup lang="ts">
import type { MessageImgProps } from './index';
import {
  ref,
  onMounted,
} from 'vue';

import type { Dimensions } from '~/types/dimensions';

defineOptions({ name: 'BMessageImg' });

const props = defineProps<MessageImgProps>();

const displayDimensions = ref<Dimensions>({ width: 0, height: 0 });

function initialize(): void {
  const limits = {
    width: Math.min(window.innerWidth, 500),
    height: Math.min(window.innerWidth, 400),
  };
  displayDimensions.value = transformDimensions(
    { width: props.picture.m.width, height: props.picture.m.height },
    limits,
  );
}

function openPicture(): void {
  const dimensions = transformDimensions(
    { width: props.picture.o.width, height: props.picture.o.height },
    { width: 1000, height: 1000 },
  );
  window.open(
    props.picture.o.link,
    props.picture.o.link,
    `height=${dimensions.height}px,width=${dimensions.width}px,resizable=1`,
  );
}

function transformDimensions(dimensions: Dimensions, limits: Dimensions): Dimensions {
  if (props.picture.o.width > limits.width || props.picture.o.height > limits.height) {
    if (props.picture.o.width > props.picture.o.height) {
      dimensions.width = limits.width;
      dimensions.height = props.picture.o.height * (limits.width / props.picture.o.width);
    } else {
      dimensions.height = limits.height;
      dimensions.width = props.picture.o.width * (limits.height / props.picture.o.height);
    }
  }
  return dimensions;
}

onMounted(initialize);
</script>

<style lang="scss" src="./message-img.scss">
</style>
