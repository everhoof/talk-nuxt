<template>
  <!-- begin .message-donation-->
  <b-message-cm :message="message">
    <div :class="classNames">
      <div class="message-donation__logo">
        <svg-icon name="donationalerts" class="message-donation__logo-icon" />
      </div>
      <div class="message-donation__info">
        <div class="message-donation__top">
          <span class="message-donation__username">{{ donation.username }}</span>
          отправил
          <span class="message-donation__amount">{{ donation.amount }} {{ donation.currency }}</span>
        </div>
        <template v-if="donation.message">
          <div class="message-donation__bottom">
            <div class="message-donation__text">
              {{ donation.message }}
            </div>
          </div>
        </template>
      </div>
    </div>
  </b-message-cm>
  <!-- end .message-donation-->
</template>

<script setup lang="ts">
import type { MessageDonationProps } from './index';
import {
  flag,
  useBMC,
} from '@rhapsodic/bem-classnames-vue';
import { computed } from 'vue';

import type { DonationJson } from '~/types/message';

defineOptions({ name: 'BMessageDonation' });

const props = defineProps<MessageDonationProps>();

const classNames = useBMC(() => ({ deleted: Boolean(props.message.deletedAt) }), 'message-donation', { deleted: flag('type', 'deleted') });

const donation = computed((): DonationJson => {
  return props.message.json!;
});

</script>

<style lang="scss" src="./message-donation.scss">
</style>
