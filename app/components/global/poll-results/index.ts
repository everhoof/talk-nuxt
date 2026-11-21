import type { PollPartsFragment } from '~/graphql/schema';

export interface PollResultsProps {
  canViewVoters?: boolean;
  busy?: boolean;
  poll: PollPartsFragment;
}

export interface PollResultsEmits {
  voters: [];
}
