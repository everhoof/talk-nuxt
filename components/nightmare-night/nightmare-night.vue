<template>
  <div class="nightmare-night" aria-hidden="true">
    <svg class="nightmare-night__garland" width="100%" height="36" fill="none">
      <defs>
        <pattern id="nightmare-night-garland" width="1440" height="36" patternUnits="userSpaceOnUse">
          <g v-for="(kind, index) in lanterns" :key="kind" :transform="`translate(${index * 360} 0)`">
            <path class="nightmare-night__cord" d="M0 3Q180 19 360 3" />
            <g
              class="nightmare-night__lantern"
              :class="[
                `nightmare-night__lantern_kind_${kind}`,
                { 'nightmare-night__lantern_place_alternate': index % 2 === 1 },
              ]"
            >
              <path class="nightmare-night__cord" d="M180 11v6" />
              <g :transform="`translate(180 23) rotate(${index % 2 === 0 ? -6 : 4}) scale(.56)`">
                <template v-if="kind === 'skull'">
                  <path
                    class="nightmare-night__paper"
                    d="M-3-8-4-14H4L3-8C10-7 12-2 11 3 10 9 5 12 0 12S-10 9-11 3C-12-2-9-7-3-8Z"
                  />
                  <ellipse
                    class="nightmare-night__cutout"
                    cx="-5"
                    cy="1"
                    rx="3"
                    ry="4.5"
                    transform="rotate(12 -5 1)"
                  />
                  <ellipse
                    class="nightmare-night__cutout"
                    cx="5"
                    cy="1"
                    rx="3"
                    ry="4.5"
                    transform="rotate(-12 5 1)"
                  />
                  <path class="nightmare-night__cutout" d="m0 5-1.7 3h3.4Z" />
                  <path class="nightmare-night__detail" d="M-3 10h6M-1 9v2M1 9v2" />
                </template>
                <template v-else-if="kind === 'pumpkin'">
                  <path
                    class="nightmare-night__paper"
                    d="M-2-8-3-14 2-15 4-12 1-8C8-11 15-6 14 2C14 10 7 14 0 12C-7 14-14 10-14 2C-15-6-8-11-2-8Z"
                  />
                  <path
                    class="nightmare-night__cutout"
                    d="M-10 1-5-5-2 2ZM2 2 5-5 10 1ZM-10 5-5 7-3 5-1 8H2L4 5 6 7 10 5Q7 12 0 11Q-7 11-10 5Z"
                  />
                </template>
                <template v-else-if="kind === 'crescent'">
                  <path
                    class="nightmare-night__paper"
                    d="M-3-11V-14H3V-11C10-9 14-4 13 3C12 10 7 14 0 14S-12 10-13 3C-14-4-10-9-3-11Z"
                  />
                  <path class="nightmare-night__cutout" d="M3-6A8 8 0 1 0 7 8A8 8 0 0 1 3-6Z" />
                  <path
                    class="nightmare-night__cutout"
                    d="m7-6 .6 1.8 1.8.6-1.8.6L7-1.2l-.6-1.8-1.8-.6 1.8-.6Z"
                  />
                </template>
                <template v-else>
                  <path class="nightmare-night__paper" d="M-5-11H5L11-6V7L5 13H-5L-11 7V-6Z" />
                  <path
                    class="nightmare-night__detail nightmare-night__detail_type_ribs"
                    d="M-5-11Q-9 1-5 13M0-11V13M5-11Q9 1 5 13M-10-5H10M-10 7H10"
                  />
                  <path class="nightmare-night__detail" d="M-4 13v3M0 13v4M4 13v3" />
                </template>
              </g>
            </g>
            <path
              v-if="index % 2 === 0"
              class="nightmare-night__moon"
              d="M306 13a4 4 0 1 0 3.4 6.3 4 4 0 0 1-3.4-6.3Z"
            />
            <path
              v-else
              class="nightmare-night__star"
              d="m306 13 .8 2.4 2.4.8-2.4.8-.8 2.4-.8-2.4-2.4-.8 2.4-.8Z"
            />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="36" fill="url(#nightmare-night-garland)" />
    </svg>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'nuxt-property-decorator';

@Component({
  name: 'b-nightmare-night',
})
export default class NightmareNight extends Vue {
  lanterns = ['skull', 'pumpkin', 'crescent', 'ribbed'];
}
</script>

<style lang="stylus" src="./nightmare-night.styl" />
