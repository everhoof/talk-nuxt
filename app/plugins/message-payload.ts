import { Message } from '~/types/message';

export default definePayloadPlugin(() => {
  definePayloadReducer('Message', (value) => value instanceof Message && { ...value });
  definePayloadReviver('Message', (value) => Object.assign(Object.create(Message.prototype), value));
});
