import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import {

  access,
  mkdtemp,
  writeFile,
  rm,
} from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  after,
  before,
  test,
} from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';

const grants = JSON.stringify({
  UNVERIFIED_USER: { message: { 'read:any': ['*'] } },
  USER: { message: { 'read:any': ['*'], 'create:own': ['*'] } },
  MODERATOR: {
    message: { 'read:any': ['*'] },
    'deleted-message': { 'read:any': ['*'] },
    poll: { 'update:any': ['*'] },
  },
});
const message = {
  id: 1,
  randomId: null,
  content: 'Nuxt 4 hydration fixture',
  username: null,
  schema: '1',
  type: 2,
  json: null,
  poll: null,
  pictures: [],
  deletedBy: null,
  createdAt: '2026-10-17T00:00:00.000Z',
  updatedAt: '2026-10-17T00:00:00.000Z',
  deletedAt: null,
  owner: { id: 42, username: 'MigrationUser', avatar: null },
};
const deletedPollMessage = {
  ...message,
  id: 2,
  type: 6,
  content: '',
  deletedAt: '2026-10-17T01:00:00.000Z',
  deletedBy: { id: 42, username: 'MigrationUser' },
  poll: {
    messageId: 2,
    question: 'Soft-deleted poll fixture',
    isAnonymous: false,
    allowMultiple: true,
    allowChangeVote: true,
    endsAt: null,
    closedAt: null,
    isClosed: false,
    serverTime: message.createdAt,
    selectedOptionIds: [],
    totalVotes: 2,
    options: [
      { id: 11, label: 'First answer', votes: 1 },
      { id: 12, label: 'Second answer', votes: 1 },
    ],
    voters: [],
  },
};
let api;
let server;
let origin;
let environmentDirectory;
let logs = '';
const operations = [];

before(async () => {
  await access(new URL('../.output/server/index.mjs', import.meta.url));
  api = createServer(async (request, response) => {
    let body = '';
    for await (const chunk of request) body += chunk;
    const { operationName } = JSON.parse(body);
    operations.push(operationName);
    if (operationName === 'GetCurrentUser' && request.headers.authorization === 'Bearer unavailable-token') {
      response.writeHead(503, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({ error: 'Session backend unavailable' }));
      return;
    }
    if (operationName === 'GetCurrentUser' && request.headers.authorization === 'Bearer expired-token') {
      response.writeHead(200, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({
        errors: [{
          message: 'Expired session',
          path: ['getCurrentUser'],
          extensions: { exception: { response: { statusCode: 401, message: 'Expired session' } } },
        }],
      }));
      return;
    }
    const isModerator = request.headers.authorization === 'Bearer moderator-token';
    const data = {
      GetGrants: { getGrants: grants },
      GetCurrentUser: {
        getCurrentUser: {
          ...message.owner,
          roles: [{ id: 1, name: isModerator ? 'MODERATOR' : 'USER' }],
          email: 'test@example.com',
          emailConfirmed: true,
          createdAt: message.createdAt,
          wasOnlineAt: message.createdAt,
        },
        getGrants: grants,
      },
      GetOnline: { getOnline: [] },
      GetActivePolls: { getActivePolls: [] },
      GetVersion: { version: 'test' },
      GetChatData: {
        messages: isModerator ? [deletedPollMessage, message] : [message],
        lastMessages: [{ id: 2 }],
      },
    }[operationName];
    response.writeHead(200, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ data: data || {} }));
  });
  api.listen(0, '127.0.0.1');
  await once(api, 'listening');
  const apiUrl = `http://127.0.0.1:${api.address().port}/graphql`;
  const portFinder = createServer();
  portFinder.listen(0, '127.0.0.1');
  await once(portFinder, 'listening');
  const port = portFinder.address().port;
  await new Promise((resolve) => portFinder.close(resolve));
  origin = `http://127.0.0.1:${port}`;
  environmentDirectory = await mkdtemp(path.join(tmpdir(), 'talk-nuxt-env-'));
  const environmentFile = path.join(environmentDirectory, '.env');
  const runtimeEnvironment = {
    NITRO_HOST: '127.0.0.1',
    NITRO_PORT: String(port),
    NUXT_PUBLIC_GRAPHQL_HTTP_ENDPOINT: apiUrl,
    NUXT_PUBLIC_GRAPHQL_WS_ENDPOINT: '',
  };
  await writeFile(environmentFile, Object.entries(runtimeEnvironment).map(([key, value]) => `${key}=${JSON.stringify(value)}`)
    .join('\n'));
  const serverEnvironment = { ...process.env, NODE_ENV: 'production' };
  for (const key of Object.keys(runtimeEnvironment)) delete serverEnvironment[key];
  server = spawn(process.execPath, [`--env-file=${environmentFile}`, '.output/server/index.mjs'], {
    cwd: new URL('..', import.meta.url),
    env: serverEnvironment,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  server.stdout.on('data', (data) => {
    logs += data;
  });
  server.stderr.on('data', (data) => {
    logs += data;
  });
  for (let attempt = 0; attempt < 100; attempt++) {
    if (server.exitCode !== null) throw new Error(logs);
    try {
      await fetch(`${origin}/favicon.png`);
      return;
    } catch {
      await delay(100);
    }
  }
  throw new Error(`Nuxt server did not start: ${logs}`);
});

after(async () => {
  if (server && server.exitCode === null) {
    server.kill();
    await once(server, 'exit');
  }
  await new Promise((resolve) => api?.close(resolve) || resolve());
  if (environmentDirectory) await rm(environmentDirectory, { recursive: true, force: true });
});

const page = (path, cookie = '') =>
  fetch(`${origin}${path}`, {
    redirect: 'manual',
    headers: { 'Accept-Language': 'ru', Cookie: cookie },
  });

test('renders SSR with serialized Pinia message data and auto imported components', async () => {
  const response = await page('/');
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Nuxt 4 hydration fixture/);
  assert.match(html, /class="chat scrollbar"/);
  assert.match(html, /Войти в чат/);
  assert.ok(operations.includes('GetChatData'));
});

test('renders nested modal routes above the chat', async () => {
  for (const [path, text] of [
    ['/login', 'login-form'],
    ['/register', 'register-form'],
    ['/settings', 'settings-modal'],
  ]) {
    const response = await page(path);
    assert.equal(response.status, 200, path);
    const html = await response.text();
    assert.ok(html.includes(text), `${path}: ${text}`);
    assert.match(html, /role="dialog"/);
    assert.match(html, /class="chat scrollbar"/);
  }
});

test('preserves soft-deleted poll data in the hydration payload for privileged viewers', async () => {
  const response = await page('/', 'token=moderator-token; user_id=42');
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Soft-deleted poll fixture/);
  assert.match(html, /First answer/);
  assert.match(html, /Second answer/);
  assert.match(html, /2026-10-17T01:00:00.000Z/);
});

test('keeps theme cookies isolated between server requests', async () => {
  const light = await (await page('/', 'settings_theme=light')).text();
  const dark = await (await page('/')).text();
  assert.match(light, /page_theme_light/);
  assert.match(dark, /page_theme_dark/);
  assert.doesNotMatch(dark.match(/<html[^>]+>/)[0], /page_theme_light/);
});

test('isolates GraphQL authentication between concurrent server requests', async () => {
  const [moderator, user, guest] = await Promise.all([
    page('/', 'token=moderator-token; user_id=42'),
    page('/', 'token=test-token; user_id=42'),
    page('/'),
  ].map(async (response) => (await response).text()));
  assert.match(moderator, /Soft-deleted poll fixture/);
  assert.doesNotMatch(user, /Soft-deleted poll fixture/);
  assert.doesNotMatch(guest, /Soft-deleted poll fixture/);
  assert.match(user, /MigrationUser/);
  assert.match(guest, /Войти в чат/);
});

test('detects language on the server and isolates locales between requests', async () => {
  const [english, russian] = await Promise.all([
    fetch(`${origin}/`, { headers: { 'Accept-Language': 'en-US' } }),
    page('/'),
  ].map(async (response) => (await response).text()));
  assert.match(english, /aria-label="Chat messages"/);
  assert.match(russian, /aria-label="Сообщения чата"/);
});

test('redirects authenticated users away from sign-in and handles missing reset tokens', async () => {
  const loggedIn = await page('/login', 'token=test-token; user_id=42');
  assert.equal(loggedIn.status, 302);
  assert.equal(loggedIn.headers.get('location'), '/');
  const reset = await page('/reset_password');
  assert.equal(reset.status, 200);
  assert.match(await reset.text(), /Произошла неизвестная ошибка/);
  const confirmation = await page('/confirm_email');
  assert.equal(confirmation.status, 302);
  assert.equal(confirmation.headers.get('location'), '/');
});

test('keeps login available after a failed user lookup and preserves the token for retry', async () => {
  const response = await page('/login', 'token=unavailable-token; user_id=42');
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /login-form/);
  assert.match(html, /Не удалось проверить сессию/);
  assert.ok(response.headers.getSetCookie().every((cookie) => !cookie.startsWith('token=;')));
});

test('expires an invalid session without redirecting away from login', async () => {
  const response = await page('/login', 'token=expired-token; user_id=42');
  assert.equal(response.status, 200);
  assert.match(await response.text(), /login-form/);
  assert.ok(response.headers.getSetCookie().some((cookie) => cookie.startsWith('token=;')));
});

test('does not initialize chat data for a password reset page', async () => {
  const before = operations.length;
  const response = await page('/reset_password');
  assert.equal(response.status, 200);
  const requested = new Set(operations.slice(before));
  for (const operation of ['GetChatData', 'GetActivePolls', 'GetOnline', 'GetVersion']) {
    assert.ok(!requested.has(operation), operation);
  }
});
