import path from 'node:path';

export default defineNuxtConfig({
  alias: {
    '@ui': path.join(import.meta.dirname, 'app'),
    '@ui-assets': path.join(import.meta.dirname, 'app/assets'),
  },
  components: {
    dirs: [{
      path: './components', prefix: 'Ui', pathPrefix: false, extensions: ['.vue'],
    }],
  },
});
