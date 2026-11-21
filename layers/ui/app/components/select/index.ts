export interface SelectProps {
  items?: string[];
  modelValue?: number | string;
}

export interface SelectEmits {
  'update:modelValue': [value: number];
}
