export interface PollButtonProps {
  type?: string;
  disabled?: boolean;
  secondary?: boolean;
}

export interface PollButtonEmits {
  click: [event: MouseEvent];
}

export interface PollButtonSlots {
  default?(): unknown;
}
