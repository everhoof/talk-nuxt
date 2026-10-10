<template>
  <!-- begin .users-list-->
  <ul class="users-list">
    <router-link
      v-for="(user, i) of users"
      :key="user.id"
      :to="{ name: 'modal_profile', params: { id: user.id } }"
      tag="li"
      class="users-list__item"
      @contextmenu.native="openContextMenu($event, i)"
    >
      <b-user-avatar
        class="users-list__avatar"
        :username="user.username"
        :user-id="user.id"
        :src="user.avatar ? user.avatar.s.link : null"
      />
      <div class="users-list__info">
        <h3 class="users-list__username">{{ user.username }}</h3>
      </div>
    </router-link>
  </ul>
  <!-- end .users-list-->
</template>

<script lang="ts">
import { Component, InjectReactive, Prop, Vue } from 'nuxt-property-decorator';
import type { OnlinePartsFragment } from '~/graphql/schema';
import BContextMenu from '~/components/context-menu/context-menu.vue';
import BUserAvatar from '~/components/user-avatar/user-avatar.vue';

@Component({
  name: 'b-users-list',
  components: { BUserAvatar },
})
export default class UsersList extends Vue {
  @Prop({ required: true }) users!: OnlinePartsFragment[];

  @InjectReactive('user-context-menu')
  readonly contextMenu!: BContextMenu;

  openContextMenu(event: MouseEvent, index: number) {
    event.preventDefault();
    event.stopPropagation();
    this.contextMenu.open(event, { user: this.users[index] });
  }
}
</script>

<style lang="stylus" src="./users-list.styl" />
