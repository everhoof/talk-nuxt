import type { PollPartsFragment } from '~/graphql/schema';

export interface PollResultItemProps {
  isAnonymous?: boolean;
  voters?: PollPartsFragment['voters'];
  busy?: boolean;
  option: PollPartsFragment['options'][number];
  totalVotes?: number | null;
  selected?: boolean;
}

export interface PollResultItemEmits {
  voters: [];
}
