import type { GetUserByIdQuery } from '~/graphql/schema';

export interface AvatarProps {
  user: GetUserByIdQuery['getUserById'] | undefined;
  tiny?: boolean;
  medium?: boolean;
  large?: boolean;
  stretch?: boolean;
}
