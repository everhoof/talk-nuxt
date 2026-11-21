import Vue3TouchEvents from 'vue3-touch-events';

export default defineNuxtPlugin(({ vueApp }) => {
  vueApp.use(Vue3TouchEvents, { disableClick: true, swipeTolerance: 100 });
});
