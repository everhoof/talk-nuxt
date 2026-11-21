export interface SwitchProps {
  id: string;
  label?: string;
  disabled?: boolean;
  margin?: boolean;
  checked?: boolean;
}

export interface SwitchEmits {
  'update:checked': [value: boolean];
}

export interface SwitchSlots {
  default?(): unknown;
}
