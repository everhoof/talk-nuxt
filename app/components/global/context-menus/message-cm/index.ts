import type { Message } from '~/types/message';

export interface MessageCmProps {
  message: Message;
}

export interface MessageCmSlots {
  default(): unknown;
}
