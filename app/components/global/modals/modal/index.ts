export interface ModalProps {
  closeLabel?: string;
  noImplicitClose?: boolean;
  noCloseButton?: boolean;
}

export interface ModalEmits {
  close: [event: Event];
}

export interface ModalSlots {
  title?(): unknown;
  default?(): unknown;
}
