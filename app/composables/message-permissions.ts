import {
  computed,
  toValue,
} from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import type { Message } from '~/types/message';
import { MessageType } from '~/types/message';

export function useMessagePermissions(source: MaybeRefOrGetter<Message | null | undefined>) {
  const auth = useAuthStore();
  return computed(() => {
    const message = toValue(source);
    const general = message?.type === MessageType.GENERAL;
    const userMessage = general || message?.type === MessageType.DICE || message?.type === MessageType.HELP;
    const mine = !!message?.owner?.id && message.owner.id === auth.userId;
    const available = !!message && !message.deletedAt && auth.loggedIn;
    return {
      profile: userMessage && !!message?.owner?.id,
      mention: userMessage && auth.loggedIn && !!message?.owner?.username,
      edit: available && (message.type === MessageType.POLL
        ? auth.can.updateAny('poll').granted
        : general && mine && auth.can.updateOwn('message').granted),
      remove: available && (auth.can.deleteAny('message').granted || (mine && auth.can.deleteOwn('message').granted)),
      punish: available && userMessage && !mine && (auth.can.updateAny('ban').granted || auth.can.updateAny('mute').granted),
    };
  });
}
