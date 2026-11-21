import type { PollPartsFragment } from '~/graphql/schema';

export interface PollChoicesProps {
  allowMultiple?: boolean;
  options: PollPartsFragment['options'];
  modelValue: number[];
  disabled?: boolean;
  idPrefix: string;
}

export interface PollChoicesEmits {
  'update:modelValue': [value: number[]];
  vote: [optionIds: number[]];
}
