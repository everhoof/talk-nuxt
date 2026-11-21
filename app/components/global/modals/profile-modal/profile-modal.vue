<template>
  <b-modal @close="$emit('close', $event)">
    <template #title>
      Профиль
    </template>
    <template #default>
      <div class="profile-modal">
        <div class="profile-modal__user">
          <b-avatar class="profile-modal__avatar" :user="user" large />
          <div class="profile-modal__user-info">
            <div class="profile-modal__username">
              <span>{{ username }}</span>
              <!-- eslint-disable vue/no-constant-condition -- Keep this existing feature disabled. -->
              <template v-if="false">
                <button type="button" class="profile-modal__username-edit">
                  <svg-icon name="edit" />
                </button>
              </template>
            </div>
            <div class="profile-modal__registered">
              {{ t('modals.profile.registered') }}: {{ registered }}
            </div>
            <div class="profile-modal__registered">{{ t('modals.profile.was_online') }}: {{ online }}</div>
          </div>
        </div>
      </div>
    </template>
  </b-modal>
</template>

<script setup lang="ts">
import type { ProfileModalEmits } from './index';
import { computed } from 'vue';

import { DateTime } from 'luxon';

import type { GetUserByIdQuery } from '~/graphql/schema';

const { t } = useI18n();

defineOptions({ name: 'BProfileModal' });

const chatStore = useChatStore();
const settingsStore = useSettingsStore();

const route = useRoute();

defineEmits<ProfileModalEmits>();

const id = computed((): number => {
  return Math.trunc(Number(route.params.id));
});

const user = computed((): GetUserByIdQuery['getUserById'] | undefined => {
  return chatStore.user(id.value);
});

const username = computed((): string => {
  return user.value?.username || 'Loading...';
});

const registered = computed((): string => {
  return user.value?.createdAt
    ? DateTime.fromISO(user.value?.createdAt)
        .setZone(settingsStore.timeZone)
        .toLocaleString(DateTime.DATE_FULL)
    : 'loading...';
});

const online = computed((): string => {
  return user.value?.wasOnlineAt
    ? DateTime.fromISO(user.value?.wasOnlineAt)
        .setZone(settingsStore.timeZone)
        .toLocaleString(DateTime.DATE_FULL)
    : 'loading...';
});

</script>

<style lang="scss" src="./profile-modal.scss">
</style>
