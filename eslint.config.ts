import { rhapsodic } from '@rhapsodic/eslint-config';

export default rhapsodic({
  ignores: ['app/graphql/{schema-types,operations}.ts', 'public/**'],
  vue: {
    a11y: true,
    overrides: {
      'vue-a11y/heading-has-content': ['error', { accessibleChildren: ['b-formatted-poll-text'] }],
      'vue/max-len': ['error', {
        code: 120, ignoreComments: true, ignoreStrings: true, ignoreTemplateLiterals: true, ignoreRegExpLiterals: true,
      }],
    },
  },
  javascript: { overrides: { 'no-empty': ['error', { allowEmptyCatch: true }] } },
  typescript: {
    parserOptions: { projectService: { allowDefaultProject: ['playwright.config.ts', '*.js'] } },
    overrides: {
      // Existing forms deliberately fall back for empty strings as well as missing values.
      'ts/prefer-nullish-coalescing': 'off',
    },
  },
}, {
  files: ['app/**/*.{ts,vue}', 'layers/**/*.{ts,vue}'],
  rules: {
    // Retain the public component props and GraphQL/store field names.
    'unicorn/consistent-boolean-name': 'off',
    // Element.getHTML requires Chrome 125, Firefox 128, and Safari 18.
    'unicorn/prefer-dom-node-html-methods': 'off',
    // Avoid control-flow rewrites during the framework and stylesheet migration.
    'unicorn/prefer-simple-condition-first': 'off',
    'unicorn/prefer-await': 'off',
    'ts/no-shadow': 'off',
  },
}, {
  files: ['**/*.vue'],
  rules: {
    // Script setup variables belong to each component instance.
    'unicorn/no-top-level-assignment-in-function': 'off',
    // Initialization remains asynchronous without blocking modal rendering.
    'unicorn/prefer-top-level-await': 'off',
  },
}, {
  files: ['tests/**/*.mjs'],
  rules: {
    // The fixtures are initialized and released by test lifecycle hooks.
    'unicorn/no-top-level-assignment-in-function': 'off',
    'unicorn/no-await-expression-member': 'off',
    'unicorn/prefer-simple-condition-first': 'off',
  },
}, {
  files: ['app/compat/browser.ts'],
  // appendChild implements the fallback for browsers without Element.append.
  rules: { 'unicorn/prefer-dom-node-append': 'off' },

}, {
  files: ['app/stores/modals.ts'],
  // Modal snapshots originate from Vue proxies, which structuredClone cannot clone.
  rules: { 'unicorn/prefer-structured-clone': 'off' },
}, {
  files: ['app/components/global/rich-input/extensions/mention/extension.ts'],
  // Tiptap binds extension callbacks through this.
  rules: { 'unicorn/no-this-outside-of-class': 'off' },
}, {
  files: ['app/types/message.ts'],
  rules: { 'unicorn/consistent-class-member-order': 'off' },
}, {
  files: ['scripts/*.cjs'],
  rules: { 'unicorn/no-process-exit': 'off' },
});
