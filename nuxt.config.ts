import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import browserslistToEsbuild from 'browserslist-to-esbuild';
import { version as faviconVersion } from './public/favicons/version.json';

export default defineNuxtConfig({
  compatibilityDate: '2026-10-17',
  extends: ['./layers/ui'],
  devtools: { enabled: true },
  typescript: { typeCheck: true, tsConfig: { include: ['../eslint.config.ts'], compilerOptions: { noUncheckedIndexedAccess: false, verbatimModuleSyntax: false } } },
  devServer: { port: Number(process.env.NITRO_PORT || 3000), host: '0.0.0.0' },
  app: {
    head: {
      title: 'Чат - Everhoof Radio',
      meta: [{ name: 'description', content: 'Чат интернет-радиостанции Everhoof Radio' }],
      link: [
        {
          key: 'favicon-png', rel: 'icon', type: 'image/png', href: `/favicon.png?v=${faviconVersion}`,
        },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,300;0,400;0,600;0,700;0,800;1,300;1,400;1,600;1,700;1,800&display=swap',
        },
      ],
      htmlAttrs: { class: 'page' },
      bodyAttrs: { class: 'page__body grid grid_type_default' },
    },
  },
  modules: ['@pinia/nuxt', '@nuxtjs/i18n', '@teages/nuxt-legacy'],
  legacy: {
    // Legacy targets come from .browserslistrc. Modern chunks need runtime polyfills too.
    vite: {
      modernPolyfills: true,
      // Chrome 49 exposes DOMException but throws when Nuxt constructs cancellation errors.
      additionalLegacyPolyfills: ['core-js/modules/web.dom-exception.constructor.js'],
    },
    customPolyfills: { scanDirs: [], polyfills: ['~/compat/browser'] },
  },
  postcss: {
    plugins: {
      // Preset Env includes Autoprefixer and reads .browserslistrc.
      autoprefixer: false,
      'postcss-preset-env': {
        minimumVendorImplementations: 2,
        preserve: false,
        // This feature needs the focus-visible runtime already loaded by the app.
        features: { 'focus-visible-pseudo-class': { preserve: true } },
      },
    },
  },
  i18n: {
    strategy: 'no_prefix',
    defaultLocale: 'ru',
    locales: [{ code: 'ru', language: 'ru-RU', file: 'ru-RU.yaml' }, { code: 'en', language: 'en-US', file: 'en-US.yaml' }],
    detectBrowserLanguage: {
      useCookie: true, cookieKey: 'i18n_redirected', fallbackLocale: 'ru', redirectOn: 'all',
    },
    compilation: { strictMessage: false },
  },
  components: [
    {
      path: '~/components/global', prefix: 'B', pathPrefix: false, extensions: ['.vue'],
    },
    {
      path: '~/components/pages', prefix: 'P', pathPrefix: false, extensions: ['.vue'],
    },
  ],
  hooks: {
    'components:extend'(components) {
      for (const component of components) {
        if (component.filePath.endsWith('/svg-icon.vue')) component.pascalName = 'SvgIcon';
        if (component.filePath.endsWith('/mention-list/mention-list.vue')) component.pascalName = 'BMentionList';
      }
    },
  },
  css: [
    '~/assets/scss/normalize.scss',
    '~/assets/scss/grid.scss',
    '~/assets/scss/global.scss',
    '~/assets/scss/colors.scss',
  ],
  vite: {
    // Override Vite builder's native-only mock, after Nuxt's default aliases are applied.
    resolve: { alias: { 'abort-controller': fileURLToPath(import.meta.resolve('abort-controller/dist/abort-controller.mjs')) } },
    build: {
      // Oxc minification can reintroduce syntax that Chrome 49 cannot parse.
      minify: 'terser',
      cssTarget: browserslistToEsbuild(),
    },
    plugins: [
      {
        name: 'graphql-documents',
        enforce: 'pre',
        transform(source, id) {
          if (!id.endsWith('.graphql')) return;
          const expand = (text: string, filename: string): string =>
            text.replaceAll(/^#import\s+["'](.+)["'].*$/gm, (_, relative) => {
              const imported = path.join(filename, '..', relative);
              return expand(readFileSync(imported, 'utf8'), imported);
            });
          return {
            code: `import { gql } from '@apollo/client/core'; export default gql(${JSON.stringify(expand(source, id))});`,
            map: null,
          };
        },
      },
    ],
  },
  runtimeConfig: {
    public: {
      apiHttpEndpoint: '',
      graphqlHttpEndpoint: '',
      graphqlWsEndpoint: '',
      discordOAuthLink: '',
    },
  },
});
