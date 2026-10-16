<template>
  <div class="mention-list">
    <template v-if="itemsCopy.length">
      <div class="mention-list__items">
        <button
          v-for="(item, index) in itemsCopy"
          :key="index"
          class="mention-list__item"
          :class="{ 'mention-list__item_is-selected': index === selectedIndex }"
          @click="selectItem(index)"
          @mousemove="hoverHandler(index)"
        >
          {{ item.label }}
        </button>
      </div>
    </template>
    <template v-else>
      <div class="mention-list__message">Нет результатов</div>
    </template>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'nuxt-property-decorator';
import { SuggestionKeyDownProps } from '@tiptap/suggestion';
import { MentionItem } from './extension';

@Component
export default class MentionList extends Vue {
  @Prop({
    type: String,
    required: true,
  })
  public readonly query!: string;

  @Prop({
    type: Array,
    required: true,
  })
  public readonly items!: MentionItem[];

  @Prop({
    type: Boolean,
    required: false,
    default: false,
  })
  public readonly isLoading!: boolean;

  @Prop({
    type: Function,
    required: true,
  })
  public readonly command!: (props: MentionItem) => void;

  private selectedIndex: number = 0;

  private itemsCopy: MentionItem[] = [];

  @Watch('items')
  private onItemsChange(): void {
    this.selectedIndex = 0;
    this.updateItems();
  }

  @Watch('isLoading')
  private onIsLoadingChange(): void {
    this.updateItems();
  }

  created(): void {
    this.updateItems();
  }

  private updateItems(): void {
    if (!this.isLoading) {
      this.itemsCopy = [...this.items];
    }
  }

  public onKeyDown({ event }: SuggestionKeyDownProps): boolean {
    if (event.key === 'ArrowUp') {
      this.upHandler();
      return true;
    }

    if (event.key === 'ArrowDown') {
      this.downHandler();
      return true;
    }

    if (event.key === 'Enter') {
      this.enterHandler();
      return true;
    }

    if (event.code === 'Space') {
      return this.spaceHandler();
    }

    return false;
  }

  private upHandler(): void {
    this.selectedIndex = (this.selectedIndex + this.itemsCopy.length - 1) % this.itemsCopy.length;
  }

  private downHandler(): void {
    this.selectedIndex = (this.selectedIndex + 1) % this.itemsCopy.length;
  }

  private hoverHandler(index: number): void {
    this.selectedIndex = index;
  }

  private enterHandler(): void {
    this.selectItem(this.selectedIndex);
  }

  private spaceHandler(): boolean {
    return this.selectItemStrict();
  }

  private selectItem(index: number): void {
    const item = this.itemsCopy[index];

    if (item) {
      this.command(item);
    }
  }

  private selectItemStrict(): boolean {
    const item = this.itemsCopy.find((item) => item.label === this.query.trim());

    if (item) {
      this.command(item);
      return true;
    }

    return false;
  }
}
</script>

<style lang="stylus">
.mention-list
  position: relative;
  overflow: hidden;
  padding: 7px;
  color: var(--text-primary);
  font-size: 14px;
  background: var(--background-secondary);
  border-radius: 10px;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, .05), 0 10px 20px rgba(0, 0, 0, .1);

  &__message
    display: flex;
    align-items: center;
    padding: 3px 11px;
    color: var(--text-primary);

  &__message-icon
    margin: 0 8px 0 0;

  &__item
    display: block;
    width: 100%;
    margin: 0;
    padding: 5px 10px;
    font-weight: 500;
    text-align: left;
    white-space: nowrap;
    color: inherit;
    cursor: pointer;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 5px;

    &_is-selected
      background: var(--background-primary);
</style>
