import './environment';
import { version as faviconVersion } from './static/favicons/version.json';

export default {
  server: {
    port: process.env.APP_PORT,
    host: '0.0.0.0',
  },
  /*
   ** Headers of the page
   */
  head: {
    title: 'Чат - Everhoof Radio',
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      {
        hid: 'description',
        name: 'description',
        content: 'Чат интернет-радиостанции Everhoof Radio',
      },
    ],
    link: [
      { hid: 'favicon-png', rel: 'icon', type: 'image/png', href: `/favicon.png?v=${faviconVersion}` },
      {
        rel: 'stylesheet',
        href:
          // eslint-disable-next-line max-len
          'https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,300;0,400;0,600;0,700;0,800;1,300;1,400;1,600;1,700;1,800&display=swap" rel="stylesheet',
      },
    ],
    htmlAttrs: {
      class: ['page'],
    },
    bodyAttrs: {
      class: ['page__body grid grid_type_default'],
    },
  },
  /*
   ** Customize the progress-bar color
   */
  loading: { color: '#fff' },
  /*
   ** Global CSS
   */
  css: [],
  styleResources: {
    stylus: ['~/assets/stylus/variables.styl', '~/assets/stylus/mixins.styl'],
  },
  /*
   ** Plugins to load before mounting the App
   */
  plugins: [
    {
      src: '~/plugins/snotify.ts',
      ssr: false,
    },
    {
      src: '~/plugins/nuxt-client-init.client.ts',
      ssr: false,
    },
    {
      src: '~/plugins/vue2-touch-events.ts',
      ssr: false,
    },
    {
      src: '~/plugins/vue-js-modal.ts',
      ssr: false,
    },
  ],
  /*
   ** Nuxt.js dev-modules
   */
  buildModules: ['@nuxt/typescript-build', '@nuxtjs/router', '@nuxtjs/style-resources', 'nuxt-typed-vuex'],
  /*
   ** Nuxt.js modules
   */
  modules: [
    'cookie-universal-nuxt',
    '@nuxtjs/svg-sprite',
    '@nuxtjs/apollo',
    [
      'nuxt-i18n',
      {
        locales: [
          {
            code: 'ru',
            name: 'Русский',
            iso: 'ru-RU',
            file: 'ru-RU.js',
          },
          {
            code: 'en',
            name: 'English',
            iso: 'en-US',
            file: 'en-US.js',
          },
        ],
        lazy: true,
        langDir: 'lang/',
        defaultLocale: 'ru',
        strategy: 'no_prefix',
        detectBrowserLanguage: {
          useCookie: true,
          cookieKey: 'i18n_redirected',
          alwaysRedirect: false,
          fallbackLocale: 'ru',
        },
      },
    ],
  ],
  /*
   ** Build configuration
   */
  build: {
    babel: {
      presets() {
        return [
          [
            '@nuxt/babel-preset-app',
            {
              corejs: { version: 3 },
            },
          ],
        ];
      },
    },
    transpile: [/typed-vuex/, /apollo/, /tiptap/],
    /*
     ** You can extend webpack config here
     */
    extend(config: any, ctx: any) {
      if (ctx.isDev && ctx.isClient) {
        config.module.rules.push({
          enforce: 'pre',
          test: /\.(ts|js|vue)$/,
          loader: 'eslint-loader',
          exclude: /(node_modules)/,
        });
      }
    },
  },
  svgSprite: {
    input: '~/assets/icons/',
  },
  apollo: {
    clientConfigs: {
      default: '~/config/apollo.ts',
    },
    tokenName: 'token',
    cookieAttributes: {
      maxAge: 86400 * 365 * 10,
      sameSite: 'lax',
      path: '/',
    },
  },
  router: {
    middleware: ['authenticated'],
  },
  publicRuntimeConfig: {
    apiHttpEndpoint: process.env.API_HTTP,
    graphqlHttpEndpoint: process.env.GRAPHQL_HTTP,
    graphqlWsEndpoint: process.env.GRAPHQL_WS,
    discordOAuthLink: process.env.DISCORD_OAUTH_LINK,
  },
};
