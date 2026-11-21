export interface CheckboxProps {
  id: string;
  disabled?: boolean;
  modelValue?: boolean;
  inline?: boolean;
  margin?: boolean;
}

export interface CheckboxEmits {
  'update:modelValue': [value: boolean];
}

export interface CheckboxSlots {
  default?(): unknown;
}
