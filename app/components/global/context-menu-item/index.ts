export interface ContextMenuItemProps {
  important?: boolean;
  icon?: string;
}

export interface ContextMenuItemEmits {
  click: [event: MouseEvent];
}

export interface ContextMenuItemSlots {
  default?(): unknown;
}
