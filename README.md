# Everhoof Instant Messaging System

## Requirements

* Node 24.22.2 (see `.nvmrc`)
* pnpm 12.15.0 (via Corepack)

#### Build Setup

```bash
# install dependencies
$ corepack enable
$ pnpm install --frozen-lockfile
$ pnpm hooks:install

# serve with hot reload at localhost:3000
$ pnpm dev

# build for production and launch server
$ pnpm build
$ pnpm start

# generate static project
$ pnpm generate
```

#### Favicons

Edit `app/assets/favicon/base.svg` for the mountain artwork and the shared badge settings
in `scripts/generate-favicons.cjs`. Digits in `app/assets/favicon/digits.json` are vector
outlines, so generation does not depend on installed fonts.

```bash
$ pnpm generate:favicons
# Also export SVG previews into .nuxt/favicons
$ pnpm generate:favicons --svg
```

Generation runs automatically before `pnpm dev`, `pnpm build`, and `pnpm generate`.
The chat uses the generated PNGs and preloads them for quick unread updates.
Only the default icon has an ICO fallback. Generated files stay in `public` and are copied into `.output/public` during the build. The generator also updates
`public/favicons/version.json` with a content-based version to invalidate cached icons when
their design changes.

#### Before commit and push run:
```bash
$ pnpm format
$ pnpm lint
$ pnpm typecheck
# production SSR regression checks (build first)
$ pnpm build
$ pnpm test
# chat scrolling regression checks against a local mock API
$ pnpm exec playwright install chromium # first run only
$ pnpm test:browser
```

#### To download the current api schema and generate types run:
```bash
$ pnpm typegen
```

## Nuxt 4 architecture

The [migration review and refactoring plan](docs/nuxt-4-migration-review.md) records
the remaining findings, follow-up order, and completion checklist.

The app runs Nuxt 4.6.4 with Vue 3 and TypeScript. Components use `<script setup>`
and Nuxt auto imports. Application components under `app/components/global/` use the `B` prefix;
page components use `P`, and reusable controls under `layers/ui/app/components/` use `Ui`
(for example, `<ui-button />`).
Application sources live in `app/`; reusable controls and shared SCSS live in `layers/ui/`.

Each component lives in its own kebab-case directory. Public props, emits, slots, and
exposed handle types are colocated in that component's `index.ts`; SFCs use named
interfaces with typed Vue macros and `withDefaults` for runtime defaults. Shared UI
components always have their own contract module. Templates use kebab-case component
tags, explicit slot templates, and template wrappers for conditional branches.
Component discovery includes only `.vue` files so contract modules are not registered
as components. Framework app, page, and layout entry files retain Nuxt's conventions.

Dynamic BEM classes use `useBMC()` and `flag()` from `@rhapsodic/bem-classnames-vue`.
Repeated elements use `bmc()` factories defined during setup. Explicit modifier settings
keep unrelated props out of class names and control which boolean states are emitted;
static classes remain literal. State modifiers use names such as `rich-input_state_disabled`.

ESLint and Stylelint use the shared Rhapsodic presets, including Vue accessibility checks.
Knip checks unused code with explicit entries for auto-registered components and external stylesheets.
Git hooks run commitlint, lint-staged, and type checking.

Browser targets are defined in `.browserslistrc`: Chrome 49+, Firefox 52+,
Safari 14.1+, iOS 14.5+, and Baseline Widely Available browsers. The
`@teages/nuxt-legacy` integration emits separate modern and legacy production
bundles, with usage-based JavaScript polyfills for each. Terser preserves the old
browser syntax target. PostCSS Preset Env reads the same Browserslist policy and
automatically selects CSS transforms and vendor prefixes for stable features.
Vite's CSS minifier targets are derived from that policy too. Source styles can
use shorthands such as `overflow` and `inset`; the build emits compatible fallbacks.
The `:focus-visible` transform is explicitly enabled because its JavaScript
companion is loaded by the app. Other CSS features requiring client scripts stay
disabled unless their companion runtime is added. Flexbox gap margins and the
chat's legacy layout workaround remain necessary where syntax transforms cannot
reproduce missing browser behavior.

Browser API shims load through `app/compat/browser.ts` before application plugins.
They include IntersectionObserver for floating UI, the DOM methods used by Unhead,
Tiptap, and TanStack Virtual, plus
`KeyboardEvent.key` for Vue's keyboard modifiers. The chat viewport uses absolute
positioning to avoid percentage-height flexbox behavior in Chrome 49.
The Pointer Events polyfill initializes before the constructible EventTarget fallback
so Reka UI can use native DOM event listeners in older browsers.
The early `00.compatibility.client.ts` plugin loads Intl support only when native
date/number parts or plural rules are missing. FormatJS stays on its pre-BigInt
major versions to support these browsers, with Russian/English locale data and
IANA time zone data for the chat's date formatting. Check compatibility before
upgrading those majors.

The pnpm patch for `fnv1a-64@0.1.2` keeps Nuxt's base36 cache keys identical while
avoiding native BigInt. Its numeric conversion is checked against the original
BigInt implementation with ASCII and Unicode inputs; keep this patch until an
upstream release provides a compatible implementation.

The Tiptap 3 core patch guards synthetic `ClipboardEvent` and `DataTransfer`
construction, matching the existing fallback for missing clipboard events. Chrome 49 exposes this API
but cannot construct it; real paste events continue through the usual editor
handlers. The legacy browser regression covers that constructor throwing as well.

Legacy support applies to `pnpm build` output; the Vite development server requires
a modern browser. Browser regressions include forcing the production legacy
bundle with missing APIs. Actual old browser engines still need separate testing
when changing dependencies or browser compatibility code.

Pinia setup stores live in `app/stores/` and are consumed directly through their
`use…Store()` composables. Authentication resolves once through route middleware;
its explicit status distinguishes authenticated users, guests, and failed lookups.
A failed lookup retains the token for retry and leaves sign-in accessible. Preferences
initialize in the app; the chat layout loads sidebar data before rendering, and
the main page owns message queries and the lifetime of live updates.
There is no injected accessor facade or global store initialization plugin.

The composer owns drafts, editing, attachment IDs, and retry state through
`useMessageComposer()`. Its transport-independent controller preserves drafts on
errors and leaves newer input untouched when an older request completes. The
rich input reports changes and handles editor shortcuts; it does not send messages.
`useMessageStream()` owns polling and subscriptions. A session version guards
asynchronous results across all message transports, and GraphQL operations do not
deduplicate across credentials. Message reconciliation uses ID and client-ID indexes,
retains deletion state, and checks message and poll freshness independently.

Reka UI supplies dialogs, menus, selects, mention popovers, tooltips, toast notifications,
and progress semantics. Existing styles and component contracts wrap these primitives;
Tiptap still owns editing and mention selection. Application code no longer uses
Popper or Tippy. Tiptap 3.33.1 uses Floating UI for its selection toolbar and Reka
UI for the mention popup. Editor components are imported directly; a Nuxt component
registration module is unnecessary. Image uploads retain Axios for progress events,
with the XHR adapter selected explicitly for legacy-browser support.

Nuxt discovers routes from `app/pages/`; page metadata preserves the existing
names and URLs. Modal pages are nested under the main chat page and render through
`<NuxtPage>`. Profile routes load their user data through `useAsyncData` before
rendering, and email confirmation refreshes only the matching authenticated user.
Context menus use public Reka roots, triggers, and content with per-message action
permissions from `useMessagePermissions()`.
Apollo Client handles HTTP requests and the API's existing `graphql-ws` subscription protocol
via `subscriptions-transport-ws`. Tiptap uses its Vue 3 adapter.

Services are accessed through composables: `useGraphql()` provides the shared Apollo
client and token changes, `useChatEvents()` provides typed events using `mitt`, and
`useModal()` / `useNotifications()` control the existing overlay UI. Their instances
are scoped to each Nuxt app, including separate server requests. `usePictureUpload()`
shares the GraphQL authentication token and retains upload progress reporting.
Cookies use Nuxt's built-in `useCookie()` refs captured during setup. Translations use
`useI18n()` from `@nuxtjs/i18n`, configured in `i18n/i18n.config.ts` with unprefixed routes.
English and Russian messages live in `i18n/locales/*.yaml`.

GraphQL Code Generator writes schema types to `app/graphql/schema-types.ts` and
operation types to `app/graphql/operations.ts`; `app/graphql/schema.ts` re-exports
their public types. `codegen.yml` maps `DateTime` to strings and configures operation
types to import shared schema types. This avoids duplicate enum and input
declarations with the installed generator. Documents are limited to operation and
fragment directories so the schema snapshot is not treated as an operation file.

Development loads `.env`, `.env.local`, `.env.development`, and
`.env.development.local` through Nuxt's native `--dotenv` option; later files override
earlier files. Runtime configuration uses `NUXT_PUBLIC_API_HTTP_ENDPOINT`,
`NUXT_PUBLIC_GRAPHQL_HTTP_ENDPOINT`, `NUXT_PUBLIC_GRAPHQL_WS_ENDPOINT`, and
`NUXT_PUBLIC_DISCORD_O_AUTH_LINK`. Set `NITRO_PORT` to override the server port.
`pnpm start` loads `.env` using Node's native `--env-file-if-exists` option.

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

#### For production
- `PRODUCTION_SSH_HOST=127.0.0.1`
- `PRODUCTION_SSH_PORT=22`
- `PRODUCTION_SSH_USER=root`
- `PRODUCTION_SSH_KEY=...`
- `PRODUCTION_APP_DIR=/path/to/production/folder`

Deploy the built `.output` directory, the selected `.env.production` or `.env.staging`
file renamed to `.env`, `.nvmrc`, and `ecosystem.config.cjs`. The deployment workflows
perform this rename when packaging the artifact. Nitro's output includes its server dependencies;
production servers do not need to install the project dependencies.

### Manual run on server (optional)
```bash
$ cd $APP_DIR
$ export NODE_ENV=production
$ pm2 start ecosystem.config.cjs
```
