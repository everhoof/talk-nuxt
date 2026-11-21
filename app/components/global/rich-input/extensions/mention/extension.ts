import { Mention as ParentExtension } from '@tiptap/extension-mention';
import { mergeAttributes } from '@tiptap/core';
import type { SuggestionOptions } from '@tiptap/suggestion';
import { VueRenderer } from '@tiptap/vue-3';
import { BMentionList } from '#components';

export interface MentionItem {
  id: number;
  label: string;
}

const suggestion: Omit<SuggestionOptions, 'editor'> = {
  items: ({ query }): Promise<MentionItem[]> => {
    return useChatStore()
      .searchUsers({ query })
      .then((users) =>
        users
          .filter((user) => user.username?.toLowerCase().includes(query.toLowerCase()))
          .slice(0, 5)
          .map(({ id, username }) => ({ id, label: username || 'unknown' })))
      .catch(() => []);
  },

  render: () => {
    let component: VueRenderer;

    return {
      onStart: (props): void => {
        component = new VueRenderer(BMentionList, {
          editor: props.editor,
          props,
        });
      },

      onBeforeUpdate(props): void {
        component.updateProps({ ...props, isLoading: true });
      },

      onUpdate(props): void {
        component.updateProps({ ...props, isLoading: false });
      },

      onKeyDown(props): boolean {
        const mentionList = component.ref as InstanceType<typeof BMentionList>;
        return mentionList.onKeyDown(props);
      },

      onExit(): void {
        component.destroy();
      },
    };
  },
};

export const Mention = ParentExtension.extend({
  addAttributes() {
    return {
      // Keep the single @ trigger internally without changing the server's mention HTML.
      mentionSuggestionChar: { default: '@', rendered: false },
      id: {
        default: null,
        parseHTML: (element): string | null => element.dataset.id ?? null,
        renderHTML: (attributes): Record<string, string> => {
          if (!attributes.id) {
            return {};
          }
          return {
            'data-id': attributes.id,
          };
        },
      },
      label: {
        default: null,
        parseHTML: (element): string | null => {
          return element.dataset.name ?? null;
        },
        renderHTML: (attributes): Record<string, string> => {
          if (!attributes.label) {
            return {};
          }
          return {
            'data-name': attributes.label,
          };
        },
      },
    };
  },
  parseHTML() {
    return [
      {
        tag: 'mention',
      },
    ];
  },
  renderHTML({ node, HTMLAttributes }) {
    return [
      'mention',
      mergeAttributes({}, this.options.HTMLAttributes, HTMLAttributes),
      this.options.renderText({
        options: this.options,
        node,
        suggestion: null,
      }),
    ];
  },
}).configure({
  suggestion,
});
