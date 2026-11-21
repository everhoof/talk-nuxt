<template>
  <!-- begin .rich-input-->
  <div :class="classNames">
    <template v-if="editor && extensionsHaveAny">
      <client-only>
        <bubble-menu
          class="rich-input__menu"
          :options="bubbleMenuOptions"
          :append-to="bubbleMenuParent"
          :editor="editor"
        >
          <ui-bubble>
            <template v-if="extensionsHave('bold')">
              <ui-bubble-button
                aria-label="Жирный"
                :is-active="editor.isActive('bold')"
                @click="editor.chain().focus().toggleBold().run()"
              >
                <template #hint>
                  Жирный
                </template>
                <template #default>
                  <svg-icon name="bold" />
                </template>
              </ui-bubble-button>
            </template>
            <template v-if="extensionsHave('italic')">
              <ui-bubble-button
                aria-label="Курсив"
                :is-active="editor.isActive('italic')"
                @click="editor.chain().focus().toggleItalic().run()"
              >
                <template #hint>
                  Курсив
                </template>
                <template #default>
                  <svg-icon name="italic" />
                </template>
              </ui-bubble-button>
            </template>
            <template v-if="extensionsHave('underline')">
              <ui-bubble-button
                aria-label="Подчёркнутый"
                :is-active="editor.isActive('underline')"
                @click="editor.chain().focus().toggleUnderline().run()"
              >
                <template #hint>
                  Подчёркнутый
                </template>
                <template #default>
                  <svg-icon name="underline" />
                </template>
              </ui-bubble-button>
            </template>
            <template v-if="extensionsHave('strike')">
              <ui-bubble-button
                aria-label="Перечёркнутый"
                :is-active="editor.isActive('strike')"
                @click="editor.chain().focus().toggleStrike().run()"
              >
                <template #hint>
                  Перечёркнутый
                </template>
                <template #default>
                  <svg-icon name="strikethrough" />
                </template>
              </ui-bubble-button>
            </template>
          </ui-bubble>
        </bubble-menu>
      </client-only>
    </template>
    <template v-if="editor">
      <editor-content :editor="editor" />
    </template>
  </div>
  <!-- end .rich-input-->
</template>

<script setup lang="ts">
import type {
  RichInputProps,
  RichInputEmits,
} from './index';
import {
  flag,
  useBMC,
} from '@rhapsodic/bem-classnames-vue';
import {

  shallowRef,
  computed,
  watch,
  onMounted,
  onBeforeUnmount,
} from 'vue';

import {
  Editor,
  EditorContent,
  Extension,
  type Extensions,
} from '@tiptap/vue-3';

import { BubbleMenu } from '@tiptap/vue-3/menus';
import { Placeholder } from '@tiptap/extensions';
import { Document } from '@tiptap/extension-document';
import { Text } from '@tiptap/extension-text';
import { Paragraph } from '@tiptap/extension-paragraph';
import { Strike } from '@tiptap/extension-strike';
import { Underline } from '@tiptap/extension-underline';
import { Italic } from '@tiptap/extension-italic';
import { Bold } from '@tiptap/extension-bold';
import { Plugin } from '@tiptap/pm/state';
import { Mention } from './extensions/mention/extension';

import type { MentionEvent } from '~/stores/messages';

defineOptions({ name: 'BRichInput' });

const props = withDefaults(defineProps<RichInputProps>(), {
  singleLine: false,
  captureEscape: false,
  disabled: false,
  required: false,
  maxLength: 0,
  inputId: '',
  labelledby: '',
  modelValue: '',
  placeholder: null,
  extensions: () => [
    Document.extend({
      content: 'block+',
    }),
    Text,
    Paragraph,
    Bold,
    Italic,
    Underline,
    Strike,
    Mention,
  ],
});

const classNames = useBMC(props, 'rich-input', { disabled: flag('state', 'disabled') });

const emit = defineEmits<RichInputEmits>();

const editor = shallowRef<Editor | null>(null);

const bubbleMenuOptions = { placement: 'top' as const };
function bubbleMenuParent(): HTMLElement {
  return (props.singleLine && editor.value?.view.dom.closest<HTMLElement>('[role="dialog"]')) || document.body;
}

const editorAttributes = computed(() => ({
  ...(props.inputId && { id: props.inputId }),
  ...(props.labelledby && { 'aria-labelledby': props.labelledby }),
  role: 'textbox',
  tabindex: props.disabled ? '-1' : '0',
  'aria-disabled': String(props.disabled),
  'aria-required': String(props.required),
  'aria-multiline': String(!props.singleLine),
}));

const extensionsHave = computed(() => {
  return (name: string): boolean => {
    return props.extensions.some((ext) => ext.name === name);
  };
});

const extensionsHaveAny = computed((): boolean => {
  return (
    extensionsHave.value('bold')
    || extensionsHave.value('italic')
    || extensionsHave.value('underline')
    || extensionsHave.value('strike')
  );
});

function initialize(): void {
  if (!import.meta.client) {
    return;
  }

  const extensions: Extensions = [
    Extension.create({
      addKeyboardShortcuts: () => {
        return {
          Enter: (): boolean => {
            emit('enter');
            return true;
          },
          Escape: (): boolean => {
            if (!props.captureEscape) return false;
            emit('escape');
            return true;
          },
          'Shift-Enter': (): boolean => {
            if (props.singleLine) return true;
            if (editor.value) {
              editor.value.commands.first(({ commands }) => [
                (): boolean => commands.newlineInCode(),
                (): boolean => commands.createParagraphNear(),
                (): boolean => commands.liftEmptyBlock(),
                (): boolean => commands.splitBlock(),
              ]);
            }
            return false;
          },
        };
      },
    }),
    ...(props.singleLine
      ? [Document.extend({ content: 'paragraph' }), Paragraph, Text, Bold, Italic, Underline, Strike]
      : props.extensions),
  ];
  if (props.maxLength) {
    const maxLength = props.maxLength;
    extensions.push(Extension.create({
      name: 'textLengthLimit',
      addProseMirrorPlugins: () => [
        new Plugin({
          filterTransaction: (transaction, state) =>
            !transaction.docChanged
            || transaction.doc.textContent.length <= maxLength
            || transaction.doc.textContent.length < state.doc.textContent.length,
        }),
      ],
    }));
  }
  if (props.placeholder) {
    extensions.push(Placeholder.configure({
      placeholder: props.placeholder,
    }));
  }
  editor.value = new Editor({
    content: props.modelValue,
    extensions,
    editable: !props.disabled,
    editorProps: {
      attributes: editorAttributes.value,
      transformPastedText: (text) => (props.singleLine ? text.replaceAll(/\s*[\r\n]+\s*/g, ' ') : text),
      transformPastedHTML: (html) => {
        if (!props.singleLine) return html;
        const container = document.createElement('div');
        container.innerHTML = html;
        container.querySelectorAll('p, div, br, li, h1, h2, h3, h4, h5, h6').forEach((node) => {
          const parent = node.parentNode;
          if (!parent) return;
          while (node.firstChild) parent.insertBefore(node.firstChild, node);
          parent.replaceChild(document.createTextNode(' '), node);
        });
        return container.innerHTML.trim();
      },
    },
    onUpdate: ({ editor }) => emit('change', { text: editor.getText(), html: editor.getHTML() }),
  });
}

function onModelValueUpdate(): void {
  setContent(props.modelValue);
}

function getText(): string {
  return editor.value?.getText() ?? '';
}

function getHtml(): string {
  return editor.value?.getHTML().replaceAll('&amp;', '&') ?? '';
}

function setContent(content: string): void {
  if (editor.value?.getHTML() !== content) editor.value?.commands.setContent(content, { emitUpdate: false });
}

function insertContent(content: string): void {
  editor.value?.chain().insertContent(`${content} `)
    .focus()
    .run();
}

function mention(event: MentionEvent): void {
  editor.value
    ?.chain()
    .insertContent({
      type: 'mention',
      attrs: {
        id: event.id,
        label: event.username,
      },
      text: `@${event.username}`,
    })
    .insertContent({
      type: 'text',
      text: ' ',
    })
    .focus()
    .run();
}

function focus(): void {
  editor.value?.chain().focus()
    .run();
}

function cleanup(): void {
  editor.value?.destroy();
}

watch(() => props.modelValue, onModelValueUpdate);
watch(
  () => props.disabled,
  () => {
    editor.value?.setOptions({
      editable: !props.disabled,
      editorProps: { attributes: editorAttributes.value },
    });
  },
);

onMounted(initialize);

onBeforeUnmount(cleanup);

defineExpose({
  getText, getHtml, setContent, insertContent, mention, focus,
});
</script>

<style lang="scss" src="./rich-input.scss">
</style>
