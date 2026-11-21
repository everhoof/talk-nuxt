import type { PollPartsFragment } from '~/graphql/schema';

export interface PollSingleChoiceProps {
  options: PollPartsFragment['options'];
  disabled?: boolean;
}

export interface PollSingleChoiceEmits {
  vote: [optionIds: number[]];
}
