export interface ActionsDropdownProps {
  label: string;
  disabled?: boolean;
  id: string;
}

export interface ActionsDropdownEmits {
  'close-context-menus': [];
}

export interface ActionsDropdownDefaultSlotProps {
  close(): void;
}

export interface ActionsDropdownSlots {
  icon?(): unknown;
  default?(props: ActionsDropdownDefaultSlotProps): unknown;
}
