<template>
  <!-- eslint-disable vue/no-constant-condition -- Existing control remains disabled. -->
  <b-modal @close="$emit('close', $event)">
    <template #title>
      {{ t('modals.punishment.mute') }} {{ username }}
    </template>
    <template #default>
      <div class="punishment-modal">
        <!--    <div class="punishment-modal__row">-->
        <!--      <span class="punishment-modal__row-description">Тип наказания:</span>-->
        <!--      <div class="punishment-modal__row-content">-->
        <!--        <b-select-->
        <!--          class="punishment-modal__punishment-select"-->
        <!--          :items="types"-->
        <!--          :model-value="selectedTypeIndex"-->
        <!--          @update:model-value="setSelectedTypeIndex"-->
        <!--        />-->
        <!--      </div>-->
        <!--    </div>-->
        <div class="punishment-modal__row">
          <span class="punishment-modal__row-description">{{ t('modals.punishment.mute_reason') }}:</span>
          <div class="punishment-modal__row-content">
            <ui-text-field
              id="punishment-custom-time"
              v-model="reason"
              class="punishment-modal__input"
              width-full
              small
            />
          </div>
        </div>
        <div class="punishment-modal__row">
          <span class="punishment-modal__row-description">{{ t('modals.punishment.mute_time') }}:</span>
          <div class="punishment-modal__row-content">
            <ui-select
              class="punishment-modal__select"
              :items="time"
              :model-value="selectedTimeIndex"
              @update:model-value="setSelectedTimeIndex"
            />
            <template v-if="isCustomTime">
              <div class="punishment-modal__custom-time">
                <ui-text-field
                  id="punishment-custom-time"
                  v-model="customTime"
                  class="punishment-modal__input"
                  width-full
                  small
                />
                <span>{{ t('modals.punishment.times.minutes') }}</span>
              </div>
            </template>
          </div>
        </div>
        <div v-show="false" class="punishment-modal__row">
          <ui-checkbox id="punishment-delete-messages" v-model="deleteMessages">
            {{ t('modals.punishment.delete_all_users_messages') }}
          </ui-checkbox>
        </div>
        <div class="punishment-modal__row">
          <ui-button width-full @click="punish()">{{ t('modals.punishment.mute') }}!</ui-button>
        </div>
      </div>
    </template>
  </b-modal>
</template>

<script setup lang="ts">
import type { PunishmentModalEmits } from './index';
import {
  ref,
  computed,
} from 'vue';

import { PunishmentTypes } from '~/graphql/schema';

defineOptions({ name: 'BPunishmentModal' });

const chatStore = useChatStore();
const { t } = useI18n();

const route = useRoute();

const emit = defineEmits<PunishmentModalEmits>();

const time = ref<string[]>([
  t('modals.punishment.times.forever'),
  t('modals.punishment.times.day'),
  t('modals.punishment.times.hour'),
  t('modals.punishment.times.ten_minutes'),
  t('modals.punishment.times.custom'),
]);

const timeValues = ref<(number | undefined)[]>([undefined, 1440, 60, 10, undefined]);

const selectedTimeIndex = ref<number>(0);

const customTime = ref<string>('30');

const deleteMessages = ref<boolean>(false);

const reason = ref<string>(t('modals.punishment.mute_reason_placeholder'));

const id = computed((): number => {
  return Math.trunc(Number(route.params.id));
});

const username = computed((): string => {
  return chatStore.user(id.value)?.username || '';
});

const isCustomTime = computed((): boolean => {
  return selectedTimeIndex.value === time.value.length - 1;
});

const duration = computed((): number | undefined => {
  return isCustomTime.value ? +customTime.value : timeValues.value[selectedTimeIndex.value];
});

function setSelectedTimeIndex(value: number) {
  selectedTimeIndex.value = value;
}

async function punish() {
  await chatStore.punishUser({
    userId: id.value,
    type: PunishmentTypes.Mute,
    duration: duration.value,
    reason: reason.value,
  });
  await emit('close');
}

</script>

<style lang="scss" src="./punishment-modal.scss">
</style>
