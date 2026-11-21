export interface ContextMenuProps {
  disabled?: boolean;
}

export interface ContextMenuSlots {
  trigger(): unknown;
  default(): unknown;
}
