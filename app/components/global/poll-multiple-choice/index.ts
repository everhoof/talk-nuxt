import type { PollPartsFragment } from '~/graphql/schema';

export interface PollMultipleChoiceProps {
  options: PollPartsFragment['options'];
  modelValue: number[];
  disabled?: boolean;
  idPrefix: string;
}

export interface PollMultipleChoiceEmits {
  'update:modelValue': [value: number[]];
}
