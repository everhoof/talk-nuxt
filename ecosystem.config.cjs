process.loadEnvFile('.env');

module.exports = {
  apps: [
    {
      name: process.env.APP_NAME,
      script: './.output/server/index.mjs',
      interpreter: process.execPath,
      autorestart: true,
      env: {
        NODE_ENV: 'production',
        NITRO_HOST: '0.0.0.0',
      },
    },
  ],
};
