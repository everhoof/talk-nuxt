<template>
  <popover-root v-model:open="opened">
    <popover-anchor :reference="anchor" />
    <popover-portal>
      <popover-content
        class="mention-list"
        side="bottom"
        align="start"
        :side-offset="4"
        @open-auto-focus.prevent
        @close-auto-focus.prevent
        @focus-outside.prevent
      >
        <template v-if="itemsCopy.length">
          <div class="mention-list__items">
            <button
              type="button"
              v-for="(item, index) in itemsCopy"
              :key="index"
              :class="itemClassNames({ selected: index === selectedIndex })"
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
      </popover-content>
    </popover-portal>
  </popover-root>
</template>

<script setup lang="ts">
import type { MentionListProps } from './index';
import {

  PopoverRoot,
  PopoverAnchor,
  PopoverPortal,
  PopoverContent,
} from 'reka-ui';
import {
  bmc,
  flag,
} from '@rhapsodic/bem-classnames-vue';
import {
  ref,
  computed,
  watch,
} from 'vue';

import type { SuggestionKeyDownProps } from '@tiptap/suggestion';
import type { MentionItem } from '../extension';

const itemClassNames = bmc('mention-list__item', { selected: flag('state', 'selected') });

const props = withDefaults(defineProps<MentionListProps>(), {
  isLoading: false,
});

defineOptions({ inheritAttrs: false });
const opened = ref(true);
const anchor = computed(() => ({
  getBoundingClientRect: () => props.clientRect?.() ?? {
    x: 0, y: 0, left: 0, right: 0, top: 0, bottom: 0, width: 0, height: 0, toJSON: () => ({}),
  },
}));
const selectedIndex = ref<number>(0);

const itemsCopy = ref<MentionItem[]>([]);

function onItemsChange(): void {
  selectedIndex.value = 0;
  updateItems();
}

function onIsLoadingChange(): void {
  updateItems();
}

function initialize(): void {
  updateItems();
}

function updateItems(): void {
  if (!props.isLoading) {
    itemsCopy.value = [...props.items];
  }
}

function onKeyDown({ event }: SuggestionKeyDownProps): boolean {
  if (event.key === 'Escape') {
    if (!opened.value) return false;
    opened.value = false;
    return true;
  }
  if (event.key === 'ArrowUp') {
    upHandler();
    return true;
  }
  if (event.key === 'ArrowDown') {
    downHandler();
    return true;
  }
  if (event.key === 'Enter') {
    enterHandler();
    return true;
  }
  if (event.code === 'Space') {
    return spaceHandler();
  }
  return false;
}

function upHandler(): void {
  selectedIndex.value = (selectedIndex.value + itemsCopy.value.length - 1) % itemsCopy.value.length;
}

function downHandler(): void {
  selectedIndex.value = (selectedIndex.value + 1) % itemsCopy.value.length;
}

function hoverHandler(index: number): void {
  selectedIndex.value = index;
}

function enterHandler(): void {
  selectItem(selectedIndex.value);
}

function spaceHandler(): boolean {
  return selectItemStrict();
}

function selectItem(index: number): void {
  const item = itemsCopy.value[index];
  if (item) {
    props.command(item);
  }
}

function selectItemStrict(): boolean {
  const item = itemsCopy.value.find((item) => item.label === props.query.trim());
  if (item) {
    props.command(item);
    return true;
  }
  return false;
}

watch(() => props.items, onItemsChange);

watch(() => props.isLoading, onIsLoadingChange);

initialize();

defineExpose({ onKeyDown });
</script>

<style lang="scss">
.mention-list {
  position: relative;
  z-index: 1100;
  overflow: hidden;
  padding: 7px;
  color: var(--text-primary);
  font-size: 14px;
  background: var(--background-secondary);
  border-radius: 10px;
  box-shadow: 0 0 0 1px rgb(0, 0, 0, .05), 0 10px 20px rgb(0, 0, 0, .1);

  &__message {
    display: flex;
    align-items: center;
    padding: 3px 11px;
    color: var(--text-primary);
  }

  &__message-icon {
    margin: 0 8px 0 0;
  }

  &__item {
    display: block;
    width: 100%;
    margin: 0;
    padding: 5px 10px;
    color: inherit;
    font-weight: 500;
    text-align: left;
    white-space: nowrap;
    cursor: pointer;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 5px;

    &_state {
      &_selected {
        background: var(--background-primary);
      }
    }
  }
}
</style>
