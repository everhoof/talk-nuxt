/** @type {import('stylelint').Config} */
export default {
  extends: ['@rhapsodic/stylelint-config'],
  rules: {
    'order/order': ['dollar-variables', 'custom-properties', 'declarations'],
    'selector-type-no-unknown': [true, { ignoreTypes: ['mention'] }],
  },
  overrides: [
    // Normalize intentionally repeats monospace to correct browser font sizing.
    { files: ['app/assets/scss/normalize.scss'], rules: { 'font-family-no-duplicate-names': null } },
    { files: ['app/assets/scss/global.scss'], rules: { 'selector-id-pattern': '^(__nuxt|__layout|[a-z][a-z0-9-]*)$' } },
  ],
};
