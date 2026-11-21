import type { Extensions } from '@tiptap/vue-3';

export interface RichInputValue {
  text: string;
  html: string;
}

export interface RichInputProps {
  singleLine?: boolean;
  captureEscape?: boolean;
  disabled?: boolean;
  required?: boolean;
  maxLength?: number;
  inputId?: string;
  labelledby?: string;
  modelValue?: string;
  placeholder?: string | null;
  extensions?: Extensions;
}

export interface RichInputEmits {
  enter: [];
  escape: [];
  change: [value: RichInputValue];
}

export interface RichInputHandle {
  insertContent: (content: string) => void;
  mention: (event: { id: number; username: string }) => void;
  focus: () => void;
}
