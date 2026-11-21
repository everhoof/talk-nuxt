export interface TextFieldProps {
  id: string;
  type?: string;
  placeholder?: string;
  modelValue?: string;
  active?: boolean;
  disabled?: boolean;
  widthFull?: boolean;
  icon?: string;
  margin?: boolean;
  name?: string;
  small?: boolean;
}

export interface TextFieldEmits {
  'update:modelValue': [value: string];
  keydown: [event: KeyboardEvent];
  keyup: [event: KeyboardEvent];
  keypress: [event: KeyboardEvent];
}
