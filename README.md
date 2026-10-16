# Everhoof Instant Messaging System

## Requirements

* Node 14

#### Build Setup

```bash
# install dependencies
$ yarn --frozen-lockfile

# serve with hot reload at localhost:3000
$ yarn dev

# build for production and launch server
$ yarn build
$ yarn start

# generate static project
$ yarn generate
```

#### To automatically create new component from template run:
```bash
$ yarn mc component-name
```

#### Favicons

Edit `assets/favicon/base.svg` for the mountain artwork and the shared badge settings
in `scripts/generate-favicons.js`. Digits in `assets/favicon/digits.json` are vector
outlines, so generation does not depend on installed fonts.

```bash
$ yarn generate:favicons
# Also export SVG previews into .nuxt/favicons
$ yarn generate:favicons --svg
```

Generation runs automatically before `yarn dev`, `yarn build`, and `yarn generate`.
The chat uses the generated PNGs and preloads them for quick unread updates.
Only the default icon has an ICO fallback. Generated files stay in `static` so
production startup does not need the renderer. The generator also updates
`static/favicons/version.json` with a content-based version to invalidate cached icons when
their design changes.

#### Before commit and push run:
```bash
$ yarn format
$ yarn lint
```

#### To download the current api schema and generate types run:
```bash
$ yarn typegen
```

## Prepare for deployment

### Create folders for app
```bash
$ mkdir -p /path/to/production/folder
$ mkdir -p /path/to/staging/folder
```

### Create Secrets in GitHub Actions:
#### For staging
- `STAGING_SSH_HOST=127.0.0.1`
- `STAGING_SSH_PORT=22`
- `STAGING_SSH_USER=root`
- `STAGING_SSH_KEY=...`
- `STAGING_APP_DIR=/path/to/staging/folder`
- `STAGING_NODE_ENV=staging`

#### For production
- `PRODUCTION_SSH_HOST=127.0.0.1`
- `PRODUCTION_SSH_PORT=22`
- `PRODUCTION_SSH_USER=root`
- `PRODUCTION_SSH_KEY=...`
- `PRODUCTION_APP_DIR=/path/to/production/folder`
- `PRODUCTION_NODE_ENV=production`

### Manual run on server (optional)
```bash
$ cd $APP_DIR
$ export NODE_ENV=production
$ pm2 start
```
or
```bash
$ cd $APP_DIR
$ export NODE_ENV=staging
$ pm2 start
```
