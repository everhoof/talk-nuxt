export interface UserAvatarProps {
  username: string;
  userId?: number | undefined;
  src?: string | null | undefined;
  tiny?: boolean;
}

export interface UserAvatarSlots {
  default?(): unknown;
}
