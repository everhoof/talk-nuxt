import type { MessagePartsFragment } from '~/graphql/schema';

export interface MessageImgProps {
  picture: MessagePartsFragment['pictures'][number];
}
