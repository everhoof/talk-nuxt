export interface FormProps {
  errors?: string[];
  title?: string;
  name: string;
}

export interface FormSlots {
  default?(): unknown;
}
