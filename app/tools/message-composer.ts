import {
  computed,
  ref,
  shallowRef,
} from 'vue';

export interface ComposerDraft {
  html: string;
  text: string;
}

export interface ComposerEdit {
  id: number;
  content: string;
}

export interface ComposerSubmission extends ComposerDraft {
  messageId?: number;
  randomId: string;
  pictures: number[];
  revision: number;
}

export interface ComposerTransport {
  submit: (submission: ComposerSubmission) => Promise<void | 'keep-draft'>;
  newId: () => string;
  errorMessage: (error: unknown) => string;
}

// The editor and API are adapters; draft recovery does not depend on either one.
export function createMessageComposer(transport: ComposerTransport) {
  const draft = ref<ComposerDraft>({ html: '', text: '' });
  const attachments = ref<number[]>([]);
  const editing = shallowRef<ComposerEdit>();
  const status = ref<'idle' | 'sending' | 'failed'>('idle');
  const error = ref('');
  const failed = shallowRef<ComposerSubmission>();
  const sending = computed(() => status.value === 'sending');
  let savedDraft: { draft: ComposerDraft; pictures: number[] } | undefined;
  let revision = 0;
  let generation = 0;

  function updateDraft(value: ComposerDraft) {
    draft.value = { ...value };
    revision++;
  }

  function startEdit(message: ComposerEdit, text: string) {
    if (sending.value || editing.value?.id === message.id) return;
    if (!editing.value) savedDraft = { draft: { ...draft.value }, pictures: [...attachments.value] };
    editing.value = message;
    attachments.value = [];
    updateDraft({ html: message.content, text });
  }

  function cancelEdit() {
    if (!editing.value) return;
    editing.value = undefined;
    updateDraft(savedDraft?.draft ?? { html: '', text: '' });
    attachments.value = savedDraft?.pictures ?? [];
    savedDraft = undefined;
  }

  async function submit(submission: ComposerSubmission): Promise<boolean> {
    if (sending.value) return false;
    const attempt = generation;
    status.value = 'sending';
    error.value = '';
    try {
      const result = await transport.submit(submission);
      if (attempt !== generation) return false;
      // Leave any newer draft or a cancelled edit alone when the response arrives.
      if (result !== 'keep-draft' && revision === submission.revision
        && editing.value?.id === submission.messageId) {
        if (submission.messageId === undefined) {
          updateDraft({ html: '', text: '' });
        } else {
          cancelEdit();
        }
      }
      attachments.value = attachments.value.filter((id) => !submission.pictures.includes(id));
      failed.value = undefined;
      status.value = 'idle';
      return true;
    } catch (error_) {
      if (attempt !== generation) return false;
      failed.value = submission;
      error.value = transport.errorMessage(error_);
      status.value = 'failed';
      return false;
    }
  }

  function send(): Promise<boolean> {
    if (!draft.value.text.trim() && attachments.value.length === 0) return Promise.resolve(false);
    return submit({
      ...draft.value,
      pictures: [...attachments.value],
      messageId: editing.value?.id,
      randomId: transport.newId(),
      revision,
    });
  }

  function retry(): Promise<boolean> {
    return failed.value ? submit(failed.value) : Promise.resolve(false);
  }

  function reset() {
    generation++;
    editing.value = undefined;
    savedDraft = undefined;
    attachments.value = [];
    failed.value = undefined;
    error.value = '';
    status.value = 'idle';
    updateDraft({ html: '', text: '' });
  }

  return {
    draft, attachments, editing, status, sending, error, failed, updateDraft, startEdit, cancelEdit, send, retry, reset,
  };
}
