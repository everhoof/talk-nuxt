export type TooltipPosition = 'left' | 'top' | 'right' | 'bottom';

export interface TooltipProps {
  position?: TooltipPosition;
  disabled?: boolean;
}

export interface TooltipSlots {
  trigger(): unknown;
  default?(): unknown;
}
