export interface AttachPanelItem {
  icon: string;
  text: string;
  id: number;
}

export interface AttachPanelEmits {
  select: [item: AttachPanelItem];
}
