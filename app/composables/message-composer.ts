import {

  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  watch,
} from 'vue';
import type { ShallowRef } from 'vue';
import axios from 'axios';
import CreateMessage from '~/graphql/mutations/create-message.graphql';
import UpdateMessage from '~/graphql/mutations/update-message.graphql';
import type {

  CreateMessageMutation,
  CreateMessageMutationVariables,
  UpdateMessageMutation,
  UpdateMessageMutationVariables,
} from '~/graphql/schema';
import type { RichInputHandle } from '~/components/global/rich-input';
import type { MentionEvent } from '~/stores/messages';
import { Message } from '~/types/message';
import { getRandomString } from '~/tools/util';
import { pollText } from '~/tools/poll-formatting';
import { createMessageComposer } from '~/tools/message-composer';
import {
  findChatCommand,
  parseChatCommand,
} from '~/tools/chat-commands';

export function useMessageComposer(editor: Readonly<ShallowRef<RichInputHandle | null>>) {
  const auth = useAuthStore();
  const messages = useMessagesStore();
  const events = useChatEvents();
  const { client } = useGraphql();
  const uploadFile = usePictureUpload();
  const notify = useNotifications();
  const { t } = useI18n();
  const uploadProgress = ref(0);
  const uploading = ref(false);
  const uploadError = ref('');
  const failedFile = shallowRef<File>();
  const identity = () => auth.sessionVersion;
  const composer = createMessageComposer({
    newId: () => getRandomString(32),
    errorMessage: (error) => (error instanceof Error ? error.message : t('chat.send_error')),
    async submit(submission) {
      if (!auth.loggedIn) throw new Error(t('chat.send_error'));
      const session = identity();
      if (submission.messageId === undefined) {
        const command = submission.pictures.length === 0 ? parseChatCommand(submission.html) : null;
        if (command?.name === 'help') {
          const target = command.argument.replace(/^\//, '');
          const list = auth.can.createOwn('command-help').granted ? 'staff_list' : 'list';
          const topic = target ? findChatCommand(target) : list;
          events.emit('private-chat-help', t(`chat_commands.private_help_${topic ?? 'unknown'}`));
          return topic ? undefined : 'keep-draft';
        }
        if (!command) {
          const pending = Message.create(submission.html, auth.user);
          pending.randomId = submission.randomId;
          messages.prependMessage(pending);
        }
        try {
          const { data, errors } = await client.mutate<CreateMessageMutation, CreateMessageMutationVariables>({
            mutation: CreateMessage,
            variables: { content: submission.html, randomId: submission.randomId, pictures: submission.pictures },
          });
          if (errors?.length) throw new Error(errors[0].message);
          if (!data?.createMessage) throw new Error(t('chat.send_error'));
        } catch (error) {
          if (!command) messages.removePendingMessage(submission.randomId);
          throw error;
        }
      } else {
        const { data, errors } = await client.mutate<UpdateMessageMutation, UpdateMessageMutationVariables>({
          mutation: UpdateMessage,
          variables: { messageId: submission.messageId, content: submission.html },
        });
        if (errors?.length) throw new Error(errors[0].message);
        if (!data?.updateMessage) throw new Error(t('chat.send_error'));
        if (session === identity()) messages.upsertMessage(new Message(data.updateMessage));
      }
      if (session === identity()) events.emit('force-scroll');
    },
  });

  function startEdit(message: Message) {
    composer.startEdit(message, pollText(message.content));
    void nextTick(() => editor.value?.focus());
  }

  function mention(value: MentionEvent) {
    editor.value?.mention(value);
  }

  const lastMessage = computed(() => messages.messages.find((message) => message.type === 2
    && !message.deletedAt && message.owner?.id === auth.userId));
  const lastMessageActions = useMessagePermissions(lastMessage);

  function onKeydown(event: KeyboardEvent) {
    if (event.defaultPrevented || event.isComposing || !auth.loggedIn) return;
    if (event.key === 'ArrowUp' && !composer.editing.value && !composer.draft.value.text.trim() && lastMessage.value && lastMessageActions.value.edit) {
      event.preventDefault();
      events.emit('start-message-edit', lastMessage.value);
    }
  }

  async function uploadPicture(file: File) {
    if (!auth.loggedIn || uploading.value || composer.sending.value || composer.editing.value) return;
    const session = identity();
    uploading.value = true;
    uploadProgress.value = 0;
    uploadError.value = '';
    failedFile.value = file;
    try {
      const id = await uploadFile(file, {
        onUploadProgress: ({ loaded, total }) => {
          if (total) uploadProgress.value = Math.floor(100 * loaded / total);
        },
      });
      if (session !== identity()) return;
      composer.attachments.value.push(id);
      failedFile.value = undefined;
      await composer.send();
    } catch (error) {
      if (session !== identity()) return;
      const response = axios.isAxiosError<{ message?: string | string[] }>(error)
        ? error.response?.data.message
        : undefined;
      uploadError.value = Array.isArray(response) ? response.join('\n') : response || t('picture_upload_error');
      notify.error(uploadError.value);
    } finally {
      uploading.value = false;
    }
  }

  function onPaste(event: ClipboardEvent) {
    const file = event.clipboardData?.files?.[0];
    if (file?.type.startsWith('image/')) {
      event.preventDefault();
      void uploadPicture(file);
    }
  }

  function onDrop(event: DragEvent) {
    const file = event.dataTransfer?.files?.[0];
    if (file?.type.startsWith('image/')) void uploadPicture(file);
  }

  function choosePicture() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.addEventListener('change', () => {
      if (input.files?.[0]) void uploadPicture(input.files[0]);
    });
    input.click();
  }

  async function retry() {
    if (failedFile.value) await uploadPicture(failedFile.value);
    else await composer.retry();
  }

  watch(identity, () => {
    composer.reset();
    failedFile.value = undefined;
    uploadError.value = '';
  });
  onMounted(() => {
    events.on('start-message-edit', startEdit);
    events.on('mention', mention);
    events.on('file-drag', onDrop);
  });
  onBeforeUnmount(() => {
    composer.reset();
    events.off('start-message-edit', startEdit);
    events.off('mention', mention);
    events.off('file-drag', onDrop);
  });

  return {
    ...composer,
    uploading,
    uploadProgress,
    send: () => (uploading.value ? Promise.resolve(false) : composer.send()),
    error: computed(() => uploadError.value || composer.error.value),
    onKeydown,
    onPaste,
    choosePicture,
    retry,
  };
}
