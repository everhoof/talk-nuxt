import type { OnlinePartsFragment } from '~/graphql/schema';

export interface UserCmProps {
  user: Pick<OnlinePartsFragment, 'id' | 'username'>;
}

export interface UserCmSlots {
  default(): unknown;
}
