export interface MessageCommandProps {
  kind: 'dice' | 'help' | 'private-help';
  content: string;
}
