<template>
  <b-context-menu :disabled="!hasActions">
    <template #trigger>
      <slot />
    </template>
    <template #default>
      <template v-if="actions.profile">
        <b-context-menu-item icon="person" @click="openProfile">Профиль</b-context-menu-item>
      </template>
      <template v-if="actions.mention">
        <b-context-menu-item icon="reply" @click="mention">Ответить</b-context-menu-item>
      </template>
      <template v-if="actions.edit">
        <b-context-menu-item icon="edit" @click="update">
          {{ message.type === 6 ? t('poll.edit') : 'Изменить сообщение' }}
        </b-context-menu-item>
      </template>
      <template v-if="actions.remove">
        <b-context-menu-item icon="delete" @click="remove">Удалить сообщение</b-context-menu-item>
      </template>
      <template v-if="actions.punish">
        <b-context-menu-item icon="hammer" important @click="punish">{{ t('modals.punishment.mute') }}</b-context-menu-item>
      </template>
    </template>
  </b-context-menu>
</template>

<script setup lang="ts">
import type {
  MessageCmProps,
  MessageCmSlots,
} from './index';
import { computed } from 'vue';
import { MessageType } from '~/types/message';

defineOptions({ name: 'BMessageCm' });
const props = defineProps<MessageCmProps>();
defineSlots<MessageCmSlots>();
const { t } = useI18n();
const actions = useMessagePermissions(() => props.message);
const hasActions = computed(() => Object.values(actions.value).some(Boolean));
const events = useChatEvents();
const messages = useMessagesStore();
const router = useRouter();

function openProfile() {
  if (actions.value.profile) void router.push({ name: 'modal_profile', params: { id: props.message.owner!.id } });
}
function mention() {
  const owner = props.message.owner;
  if (actions.value.mention && owner?.username) messages.mention({ id: owner.id, username: owner.username });
}
function update() {
  if (!actions.value.edit) return;
  if (props.message.type === MessageType.POLL) void router.push({ name: 'modal_poll_edit', params: { id: props.message.id } });
  else events.emit('start-message-edit', props.message);
}
function remove() {
  if (actions.value.remove) void messages.deleteMessage({ messageId: props.message.id });
}
function punish() {
  if (actions.value.punish) void router.push({ name: 'modal_punishment', params: { id: props.message.owner!.id } });
}
</script>

<style>
</style>
