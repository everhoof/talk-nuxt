import type { RouteLocationRaw } from 'vue-router';

export interface ButtonProps {
  tag?: string;
  small?: boolean;
  medium?: boolean;
  large?: boolean;
  block?: boolean;
  widthFull?: boolean;
  active?: boolean;
  disabled?: boolean;
  noWrap?: boolean;
  margin?: boolean;
  to?: RouteLocationRaw;
}

export interface ButtonEmits {
  click: [event: MouseEvent];
}

export interface ButtonSlots {
  default?(): unknown;
}
