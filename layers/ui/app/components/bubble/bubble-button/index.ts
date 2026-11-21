export interface BubbleButtonProps {
  isActive?: boolean;
}

export interface BubbleButtonEmits {
  click: [event: MouseEvent];
}

export interface BubbleButtonSlots {
  hint?(): unknown;
  default?(): unknown;
}
