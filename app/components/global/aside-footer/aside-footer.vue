<template>
  <div class="aside-footer">
    <dropdown-menu-root :modal="false">
      <dropdown-menu-trigger class="aside-footer__profile" aria-label="Меню профиля">
        <b-user-avatar
          class="aside-footer__avatar"
          :username="username"
          :user-id="userId"
          :src="avatar"
        />
        <span class="aside-footer__info">
          <span class="aside-footer__username">{{ username }}</span>
        </span>
      </dropdown-menu-trigger>
      <dropdown-menu-portal>
        <dropdown-menu-content
          class="aside-footer__dropdown"
          side="top"
          align="end"
          :side-offset="6"
        >
          <dropdown-menu-item as-child class="aside-footer__dropdown-item">
            <ui-button :to="{ name: 'modal_profile', params: { id: userId } }" width-full>Профиль</ui-button>
          </dropdown-menu-item>
          <dropdown-menu-item as-child class="aside-footer__dropdown-item">
            <ui-button :to="{ name: 'modal_settings' }" width-full>Настройки</ui-button>
          </dropdown-menu-item>
          <dropdown-menu-item as-child class="aside-footer__dropdown-item">
            <ui-button width-full @click="authStore.logout()">Выйти</ui-button>
          </dropdown-menu-item>
        </dropdown-menu-content>
      </dropdown-menu-portal>
    </dropdown-menu-root>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import {

  DropdownMenuRoot,
  DropdownMenuTrigger,
  DropdownMenuPortal,
  DropdownMenuContent,
  DropdownMenuItem,
} from 'reka-ui';

defineOptions({ name: 'BAsideFooter' });
const authStore = useAuthStore();
const userId = computed(() => authStore.user?.id ?? 0);
const username = computed(() => authStore.user?.username || ' ');
const avatar = computed(() => authStore.user?.avatar?.s.link || '');
</script>

<style lang="scss" src="./aside-footer.scss">
</style>
