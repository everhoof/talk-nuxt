<template>
  <!-- begin .users-list-->
  <ul class="users-list">
    <b-user-cm v-for="user of users" :key="user.id" :user="user">
      <li class="users-list__item">
        <router-link
          :to="{
            name: 'modal_profile',
            params: { id: user.id },
          }"
          class="users-list__link"
        >
          <b-user-avatar
            class="users-list__avatar"
            :username="user.username || ''"
            :user-id="user.id"
            :src="user.avatar ? user.avatar.s.link : null"
          />
          <div class="users-list__info">
            <h3 class="users-list__username">{{ user.username }}</h3>
          </div>
        </router-link>
      </li>
    </b-user-cm>
  </ul>
  <!-- end .users-list-->
</template>

<script setup lang="ts">
import type { UsersListProps } from './index';

defineOptions({ name: 'BUsersList' });
defineProps<UsersListProps>();
</script>

<style>
.users-list__link {
  display: contents;
  color: inherit;
  text-decoration: none;
}
</style>

<style lang="scss" src="./users-list.scss">
</style>
