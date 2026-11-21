<template>
  <!-- begin .aside-panel-->
  <div class="aside-panel">
    <template v-if="broadcasters.length > 0">
      <section class="aside-panel__section">
        <h2 class="aside-panel__section-title">Ведущие – {{ broadcasters.length }}</h2>
        <div class="aside-panel__section-body">
          <b-users-list :users="broadcasters" />
        </div>
      </section>
    </template>
    <template v-if="moderators.length > 0">
      <section class="aside-panel__section">
        <h2 class="aside-panel__section-title">Модераторы – {{ moderators.length }}</h2>
        <div class="aside-panel__section-body">
          <b-users-list :users="moderators" />
        </div>
      </section>
    </template>
    <section class="aside-panel__section">
      <h2 class="aside-panel__section-title">Пользователи – {{ users.length }}</h2>
      <div class="aside-panel__section-body">
        <b-users-list :users="users" />
      </div>
    </section>
  </div>
  <!-- end .aside-panel-->
</template>

<script setup lang="ts">
import { computed } from 'vue';

import type { OnlinePartsFragment } from '~/graphql/schema';

defineOptions({ name: 'BAsidePanel' });

const chatStore = useChatStore();

const online = computed((): OnlinePartsFragment[] => {
  const users = chatStore.online;
  return [...users].toSorted((a, b) => {
    const nameA = a.username?.toLowerCase() || '';
    const nameB = b.username?.toLowerCase() || '';
    if (nameA < nameB) return -1;
    if (nameA > nameB) return 1;
    return 0;
  });
});

function hasRole(user: OnlinePartsFragment, role: string): boolean {
  return user.roles.some((r) => r.name === role);
}

const broadcasters = computed(() => online.value.filter((user) => hasRole(user, 'BROADCASTER')));
const moderators = computed(() => online.value.filter((user) =>
  !hasRole(user, 'BROADCASTER') && (hasRole(user, 'ADMIN') || hasRole(user, 'MODERATOR'))));
const users = computed(() => online.value.filter((user) =>
  !hasRole(user, 'BROADCASTER') && !hasRole(user, 'ADMIN') && !hasRole(user, 'MODERATOR')));
</script>

<style lang="scss" src="./aside-panel.scss">
</style>
