import type { PollPartsFragment } from '~/graphql/schema';

export interface PollVotersModalProps {
  poll: PollPartsFragment;
  currentUserId?: number | null;
}

export interface PollVotersModalEmits {
  close: [event?: Event];
}
