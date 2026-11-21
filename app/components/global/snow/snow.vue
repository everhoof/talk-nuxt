<template>
  <!-- begin .snow-->
  <div ref="root" class="snow" />
  <!-- end .snow-->
</template>

<script setup lang="ts">
import {

  shallowRef,
  onMounted,
  onBeforeUnmount,
  useTemplateRef,
} from 'vue';

import { gsap } from 'gsap';

defineOptions({ name: 'BSnow' });

const root = useTemplateRef<HTMLDivElement>('root');

const snowflakes = shallowRef<HTMLDivElement[]>([]);

function mounted(): void {
  createSnowflakes();
  createSnow();
}

function cleanup(): void {
  destroySnowflakes();
}

function createSnowflakes(): void {
  const snowflakesCount = Math.ceil(window.innerWidth / 8);
  for (let i = 0; i < snowflakesCount; ++i) {
    const snowflake = document.createElement('div');
    snowflake.classList.add('snow__snowflake');
    root.value?.append(snowflake);
    snowflakes.value.push(snowflake);
  }
}

function destroySnowflakes(): void {
  snowflakes.value.forEach((snowflake) => {
    snowflake.remove();
  });
  snowflakes.value = [];
}

function createSnow(): void {
  snowflakes.value.forEach((snowflake) => {
    const baseX = gsap.utils.random(-10, 110);
    gsap.set(snowflake, {
      x: `${baseX}vw`,
      y: -10,
      opacity: gsap.utils.random(0, 1),
      scale: gsap.utils.random(0, 1),
    });
    gsap.to(snowflake, {
      duration: gsap.utils.random(10, 30),
      y: '100vh',
      delay: gsap.utils.random(0, -30),
      repeat: -1,
      ease: 'none',
    });
    gsap.to(snowflake, {
      duration: gsap.utils.random(5, 15),
      x: `${baseX + gsap.utils.random(-12, 12)}vw`,
      yoyo: true,
      repeat: -1,
      delay: gsap.utils.random(-20, -10),
      ease: 'power1.inOut',
    });
  });
}

onMounted(mounted);

onBeforeUnmount(cleanup);
</script>

<style lang="scss" src="./snow.scss">
</style>
