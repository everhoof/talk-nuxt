import type { MentionItem } from '../extension';

export interface MentionListProps {
  query: string;
  clientRect?: (() => DOMRect | null) | null;
  items: MentionItem[];
  isLoading?: boolean;
  command: (props: MentionItem) => void;
}
