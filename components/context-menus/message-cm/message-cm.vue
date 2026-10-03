<template>
  <!-- begin .message-cm-->
  <b-context-menu ref="context-menu">
    <b-context-menu-item v-if="showProfile" icon="person" @click="openProfile">Профиль</b-context-menu-item>
    <b-context-menu-item v-if="showMention" icon="reply" @click="mention">Ответить</b-context-menu-item>
    <b-context-menu-item v-if="showUpdate" icon="edit" @click="update">
      Изменить сообщение
    </b-context-menu-item>
    <b-context-menu-item v-if="showDelete" icon="delete" @click="remove">
      Удалить сообщение
    </b-context-menu-item>
    <b-context-menu-item v-if="showPunish" icon="hammer" important @click="punish">
      {{ $t('modals.punishment.mute') }}
    </b-context-menu-item>
  </b-context-menu>
  <!-- end .message-cm-->
</template>

<script lang="ts">
import { Component, Vue } from 'nuxt-property-decorator';
import BContextMenu from '~/components/context-menu/context-menu.vue';
import BContextMenuItem from '~/components/context-menu-item/context-menu-item.vue';
import { Message, MessageType } from '~/types/message';

@Component({
  name: 'b-message-cm',
  components: { BContextMenuItem, BContextMenu },
})
export default class MessageCm extends Vue {
  public contextMenu: BContextMenu | null = null;

  mounted(): void {
    this.contextMenu = this.$refs['context-menu'] as BContextMenu;
  }

  get canDeleteAny(): boolean {
    return this.$accessor.auth.can.deleteAny('message').granted;
  }

  get canDeleteOwn(): boolean {
    return this.$accessor.auth.can.deleteOwn('message').granted;
  }

  get canUpdateOwn(): boolean {
    return this.$accessor.auth.can.updateOwn('message').granted;
  }

  get canBan(): boolean {
    return this.$accessor.auth.can.update('ban').granted;
  }

  get canMute(): boolean {
    return this.$accessor.auth.can.update('mute').granted;
  }

  get message(): Message | null {
    return this.contextMenu?.contextData?.message ?? null;
  }

  get messageOwnerId(): number | null {
    return this.message?.owner?.id ?? null;
  }

  get isDeleted(): boolean {
    return !!this.message?.deletedAt;
  }

  get myMessage(): boolean {
    if (!this.messageOwnerId || !this.$accessor.auth.user?.id) return false;
    return this.messageOwnerId === this.$accessor.auth.user?.id;
  }

  get showProfile(): boolean {
    return this.message?.type === MessageType.GENERAL;
  }

  get showMention(): boolean {
    const loggedIn: boolean = this.$accessor.auth.loggedIn;
    const isGeneral = this.message?.type === MessageType.GENERAL;

    return loggedIn && isGeneral;
  }

  get showUpdate(): boolean {
    if (this.message?.type !== MessageType.GENERAL) return false;
    if (!this.myMessage) return false;
    return this.canUpdateOwn;
  }

  get showDelete(): boolean {
    if (this.isDeleted) return false;
    if (this.canDeleteAny) return true;
    return this.myMessage && this.canDeleteOwn;
  }

  get showPunish(): boolean {
    const isGeneral = this.message?.type === MessageType.GENERAL;
    return (this.canBan || this.canMute) && !this.myMessage && isGeneral;
  }

  openProfile(): void {
    if (!this.messageOwnerId) return;

    this.$router.push({ name: 'modal_profile', params: { id: this.messageOwnerId.toString() } });

    this.$nuxt.$emit('close-context-menus');
  }

  mention(): void {
    const owner = this.message?.owner;
    if (!owner || !owner.id || !owner.username) return;
    this.$accessor.messages.mention({ id: owner.id, username: owner.username });

    this.$nuxt.$emit('close-context-menus');
  }

  update(): void {
    if (!this.message) return;
    this.$accessor.messages.startMessageEdit(this.message);

    this.$nuxt.$emit('close-context-menus');
  }

  async remove() {
    if (!this.message) return;
    await this.$accessor.messages.deleteMessage({ messageId: this.message?.id });

    this.$nuxt.$emit('close-context-menus');
  }

  punish(): void {
    if (!this.messageOwnerId) return;

    this.$router.push({ name: 'modal_punishment', params: { id: this.messageOwnerId.toString() } });

    this.$nuxt.$emit('close-context-menus');
  }
}
</script>

<style lang="stylus" src="./message-cm.styl" />
