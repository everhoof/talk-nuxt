import type { PollPartsFragment } from '~/graphql/schema';

export interface PollVotersPreviewProps {
  voters: PollPartsFragment['voters'];
  label: string;
  disabled?: boolean;
}

export interface PollVotersPreviewEmits {
  click: [event: MouseEvent];
}
