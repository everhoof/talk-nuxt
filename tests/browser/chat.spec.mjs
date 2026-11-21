import {
  test,
  expect,
} from '@playwright/test';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { setTimeout as delay } from 'node:timers/promises';

const grants = JSON.stringify({
  UNVERIFIED_USER: { message: { 'read:any': ['*'] } },
  USER: {
    message: {
      'read:any': ['*'], 'create:own': ['*'], 'update:own': ['*'], 'delete:own': ['*'],
    },
  },
  MODERATOR: {
    message: {
      'read:any': ['*'], 'update:own': ['*'], 'delete:own': ['*'], 'delete:any': ['*'],
    },
    'deleted-message': { 'read:any': ['*'] },
    poll: { 'update:any': ['*'], 'create:own': ['*'] },
  },
});
const owner = {
  __typename: 'User', id: 42, username: 'ScrollTester', avatar: null,
};
const makeMessage = (id) => {
  const createdAt = new Date(Date.UTC(2026, 9, 16, 23) + id * 60_000).toISOString();
  return {
    id,
    __typename: 'Message',
    randomId: `message-${id}`,
    content: `<p>Message ${id}${id % 7 === 0 ? ' — variable height content'.repeat(12) : ''}</p>`,
    username: null,
    schema: '1',
    json: null,
    type: 2,
    createdAt,
    updatedAt: createdAt,
    deletedAt: null,
    deletedBy: null,
    owner,
    pictures: [],
    poll: null,
  };
};
let messages;
let requests;
let failOlder;
let historyDelay;
let api;
let server;
let origin;
let logs = '';
let browserErrors;
let createdPoll;
let pendingPolls;
let fixtureGeneration = 0;
let pollDelay;
let rejectMessage;
let rejectSession;
let emailConfirmed;
let confirmationOwnerId;
let userRole;
let rejectEdit;

const makePoll = (id) => ({
  ...makeMessage(id),
  type: 6,
  content: '',
  poll: {
    __typename: 'Poll',
    messageId: id,
    question: '<strong>Formatted</strong> active poll',
    isAnonymous: false,
    allowMultiple: false,
    allowChangeVote: false,
    endsAt: null,
    closedAt: null,
    isClosed: false,
    serverTime: makeMessage(650).createdAt,
    selectedOptionIds: [],
    totalVotes: 2,
    options: [
      { id: 1, label: '<em>First</em> answer', votes: 1 },
      { id: 2, label: 'Second answer', votes: 1 },
    ],
    voters: [],
  },
});

const appState = (page) =>
  page.evaluate(() => {
    const store
      = document.querySelector('#__nuxt').__vue_app__.config.globalProperties.$pinia._s.get('messages');
    const scroll = document.querySelector('.chat');
    return {
      count: store.rawMessages.length,
      older: store.hasOlderMessages,
      newer: store.hasNewerMessages,
      top: scroll.scrollTop,
      bottom: scroll.scrollHeight - scroll.clientHeight - scroll.scrollTop,
      rendered: scroll.querySelectorAll('.chat__message').length,
      latest: store.messages[0]?.id,
      unread: store.unreadCount,
    };
  });
const readAnchor = (page) =>
  page.evaluate(() => {
    const scroll = document.querySelector('.chat');
    const edge = scroll.getBoundingClientRect().top;
    const row = [...scroll.querySelectorAll('.chat__message')].find((e) => e.getBoundingClientRect().bottom > edge);
    return { id: row.dataset.messageId, y: row.getBoundingClientRect().top - edge };
  });
const anchorY = (page, id) =>
  page
    .locator(`[data-message-id="${id}"]`)
    .evaluate((row) => row.getBoundingClientRect().top - document.querySelector('.chat').getBoundingClientRect().top);
const openChat = async (page, path = '/') => {
  await page.goto(`${origin}${path}`);
  await page.waitForFunction(() =>
    document.querySelector('#__nuxt')?.__vue_app__?.config.globalProperties.$nuxt?.isHydrating === false);
  await expect(page.locator('.chat__message').first()).toBeAttached();
};

const setWindowState = (page, visible, focused = visible) =>
  page.evaluate(
    ({ visible, focused }) => {
      Object.defineProperties(document, {
        visibilityState: {
          configurable: true,
          get: () => (visible ? 'visible' : 'hidden'),
        },
        hasFocus: { configurable: true, value: () => focused },
      });
      document.dispatchEvent(new Event('visibilitychange'));
      dispatchEvent(new Event(focused ? 'focus' : 'blur'));
    },
    { visible, focused },
  );

const expectFavicon = (page, count) =>
  expect
    .poll(() =>
      page.evaluate(async (count) => {
        const path = count === 0 ? '/favicon.png' : `/favicons/unread-${count > 9 ? 'dot' : count}.png`;
        const href = document.querySelector('link[rel="icon"]').href;
        const actual = new Uint8Array(await (await fetch(href)).arrayBuffer());
        const expected = new Uint8Array(await (await fetch(path)).arrayBuffer());
        return actual.length === expected.length && actual.every((byte, index) => byte === expected[index]);
      }, count))
    .toBe(true);

test.beforeAll(async () => {
  api = createServer(async (request, response) => {
    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
    if (request.method === 'OPTIONS') {
      response.writeHead(204, headers);
      response.end();
      return;
    }
    let body = '';
    for await (const chunk of request) body += chunk;
    const { operationName, variables = {} } = JSON.parse(body);
    if (operationName === 'GetCurrentUser' && rejectSession) {
      response.writeHead(503, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({ error: 'Session backend unavailable' }));
      return;
    }

    let data = {
      OnlineUpdated: { onlineUpdated: null },
      MessageUpdated: { messageUpdated: null },
      MessageDeleted: { messageDeleted: null },
      UserUpdated: { userUpdated: null },
    }[operationName] ?? {};
    let errors;
    if (operationName === 'GetGrants') data = { getGrants: grants };
    else if (operationName === 'SignIn') data = { signIn: { ownerId: 42, value: 'test-token' } };
    else if (operationName === 'GetCurrentUser') data = {
      getCurrentUser: {
        ...owner,
        roles: [{ id: 1, name: userRole }],
        email: 'test@example.com',
        emailConfirmed,
        createdAt: makeMessage(1).createdAt,
        wasOnlineAt: makeMessage(1).createdAt,
      },
      getGrants: grants,
    };
    else if (operationName === 'ConfirmEmail') {
      if (confirmationOwnerId === owner.id) emailConfirmed = true;
      data = { confirmEmail: { id: 1, ownerId: confirmationOwnerId } };
    } else if (operationName === 'GetUserById') data = {
      getUserById: {
        ...owner,
        id: variables.id,
        username: variables.id === owner.id ? owner.username : `User${variables.id}`,
        email: 'test@example.com',
        emailConfirmed: true,
        createdAt: makeMessage(1).createdAt,
        wasOnlineAt: makeMessage(1).createdAt,
        roles: [{ id: 1, name: 'USER' }],
      },
    };
    else if (operationName === 'UpdateMessage') {
      if (rejectEdit) errors = [{ message: 'Edit rejected', extensions: { exception: { response: { statusCode: 400, message: ['Edit rejected'] } } } }];
      else {
        const message = messages.find(({ id }) => id === variables.messageId);
        message.content = variables.content;
        message.updatedAt = new Date().toISOString();
        data = { updateMessage: message };
      }
    } else if (operationName === 'DeleteMessage') {
      const message = messages.find(({ id }) => id === variables.messageId);
      message.deletedAt = new Date().toISOString();
      data = { deleteMessage: message };
    } else if (operationName === 'SearchUsers') data = { searchUsers: [owner] };
    else if (operationName === 'GetOnline') data = {
      getOnline: [{
        ...owner,
        email: 'test@example.com',
        emailConfirmed: true,
        createdAt: makeMessage(1).createdAt,
        wasOnlineAt: makeMessage(1).createdAt,
        roles: [{ id: 1, name: 'USER' }],
      }],
    };
    else if (operationName === 'GetActivePolls') data = {
      getActivePolls: messages.filter((message) => message.poll && !message.poll.isClosed && !message.deletedAt),
    };
    else if (operationName === 'GetPoll') data = { getPoll: messages.find((message) => message.id === variables.messageId)?.poll };
    else if (operationName === 'CreatePoll') {
      createdPoll = variables;
      data = { createPoll: { ...makePoll(651), poll: { ...makePoll(651).poll, ...variables } } };
    } else if (operationName === 'GetVersion') data = { version: 'test' };
    else if (operationName === 'CreateMessage') {
      const message = {
        ...makeMessage(messages.at(-1).id + 1),
        content: variables.content,
        randomId: variables.randomId,
      };
      if (rejectMessage) {
        errors = [{
          message: 'Message rejected',
          extensions: { exception: { response: { statusCode: 400, message: ['Message rejected'] } } },
        }];
      } else {
        messages.push(message);
        data = { createMessage: { id: message.id } };
      }
    } else if (operationName === 'GetChatData') {
      const history = messages.filter((m) => {
        return !variables.fromDateTime || Date.parse(m.createdAt) <= Date.parse(variables.fromDateTime);
      });
      data = { messages: history.slice(-100).toReversed(), lastMessages: [{ id: messages.at(-1)?.id ?? 0 }] };
    } else if (operationName === 'GetMessages') {
      const generation = fixtureGeneration;
      requests.push(variables);
      if (variables.poll) pendingPolls++;
      await delay(variables.poll ? pollDelay : (variables.lastId ? historyDelay : 250));
      // A request from a closed context can finish after the next fixture starts.
      if (variables.poll && generation === fixtureGeneration) pendingPolls--;
      if (!variables.poll && variables.reverse && variables.lastId && failOlder) {
        failOlder = false;
        errors = [{ message: 'History is temporarily unavailable' }];
      } else {
        const eligible = messages.filter((m) => {
          if (variables.lastId) return variables.reverse ? m.id < variables.lastId : m.id > variables.lastId;
          if (variables.fromDateTime) return variables.reverse
            ? Date.parse(m.createdAt) <= Date.parse(variables.fromDateTime)
            : Date.parse(m.createdAt) >= Date.parse(variables.fromDateTime);
          return true;
        });
        const page
          = variables.reverse || (!variables.lastId && !variables.fromDateTime)
            ? eligible.slice(-(variables.count || 100))
            : eligible.slice(0, variables.count || 100);
        data = { getMessages: page.toReversed() };
      }
    }
    response.writeHead(200, headers);
    response.end(JSON.stringify(errors ? { errors } : { data }));
  });
  api.listen(0, '127.0.0.1');
  await once(api, 'listening');
  const portFinder = createServer();
  portFinder.listen(0, '127.0.0.1');
  await once(portFinder, 'listening');
  const port = portFinder.address().port;
  await new Promise((resolve) => portFinder.close(resolve));
  origin = `http://127.0.0.1:${port}`;
  server = spawn(process.execPath, ['.output/server/index.mjs'], {
    env: {
      ...process.env,
      NODE_ENV: 'production',
      NITRO_HOST: '127.0.0.1',
      NITRO_PORT: String(port),
      NUXT_PUBLIC_GRAPHQL_HTTP_ENDPOINT: `http://127.0.0.1:${api.address().port}/graphql`,
      NUXT_PUBLIC_GRAPHQL_WS_ENDPOINT: '',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  server.stdout.on('data', (data) => {
    logs += data;
  });
  server.stderr.on('data', (data) => {
    logs += data;
  });
  for (let i = 0; i < 100; i++) {
    if (server.exitCode !== null) throw new Error(logs);
    try {
      await fetch(`${origin}/favicon.png`);
      return;
    } catch {
      await delay(100);
    }
  }
  throw new Error(`Nuxt did not start: ${logs}`);
});

test.afterAll(async () => {
  if (server && server.exitCode === null) {
    server.kill();
    await once(server, 'exit');
  }
  await new Promise((resolve) => api?.close(resolve) || resolve());
});

test.beforeEach(async ({ context, page }) => {
  fixtureGeneration++;
  messages = Array.from({ length: 650 }, (_, i) => makeMessage(i + 1));
  messages[639] = {
    ...makeMessage(640),
    type: 6,
    content: '',
    poll: {
      messageId: 640,
      question: 'Variable height poll',
      isAnonymous: false,
      allowMultiple: false,
      allowChangeVote: false,
      endsAt: null,
      closedAt: makeMessage(640).createdAt,
      isClosed: true,
      serverTime: makeMessage(650).createdAt,
      selectedOptionIds: [],
      totalVotes: 0,
      options: [
        { id: 1, label: 'First answer', votes: 0 },
        { id: 2, label: 'Second answer', votes: 0 },
      ],
      voters: [],
    },
  };
  requests = [];
  failOlder = false;
  historyDelay = 250;
  pendingPolls = 0;
  pollDelay = 300;
  rejectMessage = false;
  rejectSession = false;
  emailConfirmed = true;
  confirmationOwnerId = owner.id;
  userRole = 'MODERATOR';
  rejectEdit = false;
  browserErrors = [];
  createdPoll = undefined;
  page.on('pageerror', (error) => {
    browserErrors.push(error.message);
  });
  await context.addCookies([
    { name: 'token', value: 'test-token', url: origin },
    { name: 'user_id', value: '42', url: origin },
    { name: 'politics_restricted_showed', value: '1', url: origin },
  ]);
});
test.afterEach(() => expect(browserErrors).toEqual([]));

test('boots legacy production chunks with missing browser APIs', async ({ context, page }) => {
  // Fulfilled navigation responses need explicit permission for the loopback mock API's XHR requests.
  await context.grantPermissions(['local-network-access']);
  const legacyScripts = [];
  page.on('request', (request) => {
    if (request.url().includes('-legacy')) legacyScripts.push(request.url());
  });
  await page.route('**/*', async (route) => {
    if (!route.request().isNavigationRequest()) return route.continue();
    const response = await route.fetch();
    // Exercise the actual nomodule bundle in the current Chromium test runner.
    const body = (await response.text())
      .replaceAll(/<script\b[^>]*\btype="module"[^>]*>[\s\S]*?<\/script>/g, '')
      .replaceAll(/\snomodule(?:="[^"]*")?/g, '');
    await route.fulfill({ response, body });
  });
  await page.addInitScript(() => {
    for (const key of ['ResizeObserver', 'IntersectionObserver', 'AbortController', 'AbortSignal', 'BigInt', 'DOMException']) {
      Reflect.deleteProperty(globalThis, key);
    }
    // Old engines expose the native DOM event prototype but prohibit constructing EventTarget.
    function NonConstructibleEventTarget() {
      throw new TypeError('Illegal constructor');
    }
    NonConstructibleEventTarget.prototype = EventTarget.prototype;
    Object.defineProperty(globalThis, 'EventTarget', { configurable: true, writable: true, value: NonConstructibleEventTarget });
    for (const key of ['toSorted', 'toReversed', 'at']) Reflect.deleteProperty(Array.prototype, key);
    for (const key of ['Locale', 'PluralRules', 'getCanonicalLocales']) Reflect.deleteProperty(Intl, key);
    Reflect.deleteProperty(Intl.DateTimeFormat.prototype, 'formatToParts');
    Reflect.deleteProperty(Intl.NumberFormat.prototype, 'formatToParts');
    Reflect.deleteProperty(Element.prototype, 'scrollTo');
    Reflect.deleteProperty(CSSStyleDeclaration.prototype, 'scrollBehavior');
    Reflect.deleteProperty(Node.prototype, 'getRootNode');
    Reflect.deleteProperty(Element.prototype, 'getAttributeNames');
    Reflect.deleteProperty(Element.prototype, 'append');
    Reflect.deleteProperty(Node.prototype, 'isConnected');
    Reflect.deleteProperty(KeyboardEvent.prototype, 'key');
    Object.defineProperties(globalThis, {
      ClipboardEvent: {
        configurable: true,
        value: class {
          constructor() {
            throw new TypeError('Illegal constructor');
          }
        },
      },
      __forceSmoothScrollPolyfill__: { configurable: true, value: true },
    });
  });
  await context.clearCookies();
  await context.addCookies([{ name: 'politics_restricted_showed', value: '1', url: origin }]);
  await openChat(page, '/login');
  await page.locator('#login_username').fill('ScrollTester');
  await page.locator('#login_username').press('Enter');
  await expect(page.locator('#login_password')).toBeFocused();
  await page.locator('#login_password').fill('test-password');
  await page.locator('.login-modal__button').click();
  await expect(page.locator('.login-modal')).toHaveCount(0);
  await expect(page.locator('.aside-footer__username')).toHaveText('ScrollTester');
  await page.locator('.footer [contenteditable="true"]').fill('Legacy bundle message');
  await page.locator('.footer [contenteditable="true"]').press('Enter');
  await expect(page.locator('.chat')).toContainText('Legacy bundle message');
  await expect.poll(async () => (await appState(page)).latest).toBe(651);
  const loadedCount = (await appState(page)).count;
  await page.locator('.chat').evaluate((element) => {
    element.scrollTop = 0;
  });
  await expect.poll(async () => (await appState(page)).count).toBeGreaterThan(loadedCount);
  await page.getByRole('button', { name: 'Меню профиля' }).click();
  await page.getByRole('menuitem', { name: 'Настройки', exact: true }).click();
  await page.getByRole('combobox').click();
  await page.getByRole('option').nth(1)
    .click();
  await page.getByRole('button', { name: 'Закрыть', exact: true }).click();
  expect(legacyScripts.length).toBeGreaterThan(0);
});

test('signs in and out while message polling is in flight', async ({ context, page }) => {
  await context.clearCookies();
  await context.addCookies([{ name: 'politics_restricted_showed', value: '1', url: origin }]);
  pollDelay = 2000;
  const consoleErrors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  await openChat(page, '/login');
  await page.locator('#login_username').fill('ScrollTester');
  await page.locator('#login_username').press('Enter');
  await expect(page.locator('#login_password')).toBeFocused();
  await page.locator('#login_password').fill('test-password');
  await expect.poll(() => pendingPolls).toBeGreaterThan(0);
  await page.locator('.login-modal').getByRole('button', { name: 'Войти', exact: true })
    .click();
  await expect(page.locator('.login-modal')).toHaveCount(0);
  await expect(page.locator('.aside-footer__username')).toHaveText('ScrollTester');
  await page.locator('.aside-footer__profile').click();
  await expect.poll(() => pendingPolls).toBeGreaterThan(0);
  await page.getByRole('menuitem', { name: 'Выйти', exact: true }).click();
  await expect(page.locator('.aside-footer')).toHaveCount(0);
  const pollCount = requests.filter((request) => request.poll).length;
  await expect.poll(() => requests.filter((request) => request.poll).length).toBeGreaterThan(pollCount);
  expect(consoleErrors).toEqual([]);
});

test('shows a deleted poll notice without requesting unavailable poll details', async ({ page }) => {
  messages.push({
    ...makeMessage(651), type: 6, content: '', deletedAt: makeMessage(651).createdAt, poll: null,
  });
  const pollRequests = [];
  page.on('request', (request) => {
    if (request.method() === 'POST' && request.postDataJSON()?.operationName === 'GetPoll') {
      pollRequests.push(request.postDataJSON());
    }
  });
  await openChat(page);
  const deletedPoll = page.locator('[data-message-id="651"]');
  await expect(deletedPoll).toContainText('Опрос удалён. Голосование недоступно.');
  await expect(deletedPoll.locator('[role="alert"]')).toHaveCount(0);
  expect(pollRequests).toEqual([]);
});

test('displays GraphQL errors through the notification composable', async ({ page }) => {
  rejectMessage = true;
  await openChat(page);
  await page.locator('.footer [contenteditable="true"]').fill('Rejected test message');
  await page.getByRole('button', { name: 'Отправить сообщение' }).click();
  await expect(page.locator('.notification')).toContainText('Message rejected');
  await page.getByRole('button', { name: 'Закрыть уведомление' }).click();
  await expect(page.locator('.notification')).toHaveCount(0);
  await expect(page.locator('.chat__message').filter({ hasText: 'Rejected test message' })).toHaveCount(0);
});

test('persists settings through Nuxt cookies after a reload', async ({ context, page }) => {
  await openChat(page, '/settings');
  await page.locator('label[for="settings_theme"]').click();
  await page.locator('label[for="settings_compact"]').click();
  await expect(page.locator('html')).toHaveClass(/page_theme_light/);
  await expect.poll(async () => (await context.cookies()).find((cookie) => cookie.name === 'settings_theme')?.value).toBe('light');
  await expect.poll(async () => (await context.cookies()).find((cookie) => cookie.name === 'settings_compact')?.value).toBe('false');
  await page.reload();
  await expect(page.locator('#settings_theme')).not.toBeChecked();
  await expect(page.locator('#settings_compact')).not.toBeChecked();
  await expect(page.locator('html')).toHaveClass(/page_theme_light/);
});

test('opens and closes a shared voter modal from a poll action', async ({ page }) => {
  messages.push(makePoll(651));
  await openChat(page);
  const poll = page.locator('[data-message-id="651"]');
  await poll.getByRole('button', { name: 'Действия с опросом', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Кто проголосовал', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Кто проголосовал', exact: true });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('Всего участников: 2');
  await dialog.getByRole('button', { name: 'Закрыть', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(poll.getByRole('button', { name: 'Действия с опросом', exact: true })).toBeFocused();
});

test('virtualizes dynamic rows and anchors older pages without trimming loaded history', async ({ page }) => {
  await openChat(page);
  await expect.poll(async () => (await appState(page)).bottom).toBeLessThan(2);
  expect((await appState(page)).rendered).toBeLessThan(80);
  await expect(page.getByRole('heading', { name: 'Variable height poll' })).toBeAttached();
  for (const count of [200, 300, 400]) {
    await page.locator('.chat').evaluate((el) => {
      el.scrollTop = 600;
    });
    await page.waitForTimeout(40);
    const anchor = await readAnchor(page);
    await expect.poll(async () => (await appState(page)).count).toBe(count);
    await expect.poll(async () => Math.abs((await anchorY(page, anchor.id)) - anchor.y)).toBeLessThan(3);
    expect((await appState(page)).rendered).toBeLessThan(80);
    expect((await appState(page)).latest).toBe(650);
  }
});

test('follows live messages only at the bottom and counts new messages while reading', async ({ page }) => {
  await openChat(page);
  const title = await page.title();
  await expect.poll(async () => (await appState(page)).bottom).toBeLessThan(2);
  messages.push(makeMessage(651));
  await expect.poll(async () => (await appState(page)).latest).toBe(651);
  await expect.poll(async () => (await appState(page)).bottom).toBeLessThan(2);
  await page.locator('.chat').evaluate((el) => {
    el.scrollTop -= 1200;
  });
  await page.waitForTimeout(200);
  const anchor = await readAnchor(page);
  messages.push(makeMessage(652), makeMessage(653));
  await expect.poll(async () => (await appState(page)).latest).toBe(653);
  await expect.poll(async () => Math.abs((await anchorY(page, anchor.id)) - anchor.y)).toBeLessThan(3);
  await expect(page.locator('.chat__jump')).toContainText('Новых сообщений: 2');
  await expect(page).toHaveTitle(title);
  await expectFavicon(page, 2);
  await setWindowState(page, false);
  await setWindowState(page, true);
  expect((await appState(page)).unread).toBe(2);
  await page.locator('.chat__jump').click();
  await expect.poll(async () => (await appState(page)).bottom).toBeLessThan(2);
  await expect(page.locator('.chat__jump')).toHaveCount(0);
  await expect(page).toHaveTitle(title);
  await expectFavicon(page, 0);
});

test('updates the unread favicon while keeping the title unchanged', async ({ page }) => {
  await openChat(page);
  const title = await page.title();
  await setWindowState(page, false);
  messages.push(makeMessage(651), makeMessage(652), { ...makeMessage(653), type: 1 });
  await expect.poll(async () => (await appState(page)).unread).toBe(2);
  await expect(page).toHaveTitle(title);
  await expectFavicon(page, 2);
  messages.push(...Array.from({ length: 9 }, (_, index) => makeMessage(654 + index)));
  await expect.poll(async () => (await appState(page)).unread).toBe(11);
  await expect(page).toHaveTitle(title);
  await expectFavicon(page, 11);
  await setWindowState(page, true);
  await expect.poll(async () => (await appState(page)).unread).toBe(0);
  await expect(page).toHaveTitle(title);
  await expectFavicon(page, 0);
});

test('counts messages in an unfocused visible window and clears them when focused at latest', async ({
  page,
}) => {
  await openChat(page);
  const title = await page.title();
  await setWindowState(page, true, false);
  messages.push(makeMessage(651));
  await expect.poll(async () => (await appState(page)).unread).toBe(1);
  await expect(page).toHaveTitle(title);
  await expectFavicon(page, 1);
  await setWindowState(page, true);
  await expect(page).toHaveTitle(title);
  await expectFavicon(page, 0);
});

test('sending from one tab updates the unread favicon without changing the other tab title', async ({
  page,
  context,
}) => {
  await openChat(page);
  const title = await page.title();
  const sender = await context.newPage();
  sender.on('pageerror', (error) => {
    browserErrors.push(error.message);
  });
  try {
    await openChat(sender);
    await sender.bringToFront();
    const editor = sender.locator('[contenteditable="true"]');
    await editor.fill('Message sent from another tab');
    await editor.press('Enter');
    await expect.poll(async () => (await appState(page)).latest).toBe(651);
    await expect.poll(async () => (await appState(page)).unread).toBe(1);
    await expect(page).toHaveTitle(title);
    await expectFavicon(page, 1);
    // Each tab polls independently; finish delivery in the sender before moving focus.
    await expect.poll(async () => (await appState(sender)).latest).toBe(651);
    expect((await appState(sender)).unread).toBe(0);
    await page.bringToFront();
    await page.locator('[contenteditable="true"]').click();
    await expect.poll(async () => (await appState(page)).unread).toBe(0);
    await expect(page).toHaveTitle(title);
    await expectFavicon(page, 0);
    const replyEditor = page.locator('[contenteditable="true"]');
    await replyEditor.fill('Reply from the other tab');
    await replyEditor.press('Enter');
    await expect.poll(async () => (await appState(sender)).latest).toBe(652);
    await expect.poll(async () => (await appState(sender)).unread).toBe(1);
    await expect(sender).toHaveTitle(title);
    await expectFavicon(sender, 1);
    expect((await appState(page)).unread).toBe(0);
  } finally {
    await sender.close();
  }
});

test('keeps the bottom pinned when a visible message grows', async ({ page }) => {
  await openChat(page);
  await expect.poll(async () => (await appState(page)).bottom).toBeLessThan(2);
  await page.evaluate(() => {
    const store
      = document.querySelector('#__nuxt').__vue_app__.config.globalProperties.$pinia._s.get('messages');
    store.upsertMessage({ ...store.messages[0], content: '<p>Growing content</p>'.repeat(40) });
  });
  await expect(page.getByText('Growing content', { exact: true }).first()).toBeAttached();
  await expect.poll(async () => (await appState(page)).bottom).toBeLessThan(2);
});

test('preserves the visible message when a measured row above it grows', async ({ page }) => {
  await openChat(page);
  await page.locator('.chat').evaluate((el) => {
    el.scrollTop = 1400;
  });
  await page.waitForTimeout(250);
  const anchor = await readAnchor(page);
  await page.evaluate(() => {
    const viewport = document.querySelector('.chat').getBoundingClientRect().top;
    const above = [...document.querySelectorAll('.chat__message')]
      .findLast((row) => row.getBoundingClientRect().bottom < viewport);
    const store
      = document.querySelector('#__nuxt').__vue_app__.config.globalProperties.$pinia._s.get('messages');
    const message = store.rawMessages.find((m) => m.id === Number(above.dataset.messageId));
    store.upsertMessage({ ...message, content: '<p>Expanded row</p>'.repeat(20) });
  });
  await expect(page.getByText('Expanded row', { exact: true }).first()).toBeAttached();
  await expect.poll(async () => Math.abs((await anchorY(page, anchor.id)) - anchor.y)).toBeLessThan(3);
});

test('shows the first live message in an initially empty chat', async ({ page }) => {
  messages = [];
  await page.goto(origin);
  await page.waitForFunction(() =>
    document.querySelector('#__nuxt')?.__vue_app__?.config.globalProperties.$nuxt?.isHydrating === false);
  expect((await appState(page)).count).toBe(0);
  messages.push(makeMessage(1));
  await expect(page.locator('[data-message-id="1"]')).toBeVisible();
  expect((await appState(page)).bottom).toBeLessThan(2);
});

test('shows a retry after a failed history page and stops requesting exhausted history', async ({ page }) => {
  await openChat(page);
  failOlder = true;
  await page.locator('.chat').evaluate((el) => {
    el.scrollTop = 600;
  });
  const retry = page.locator('.chat__status_direction_older button');
  await expect(retry).toBeVisible();
  const failedCount = requests.filter((r) => r.reverse && r.lastId).length;
  await page.waitForTimeout(500);
  expect(requests.filter((r) => r.reverse && r.lastId).length).toBe(failedCount);
  await retry.click();
  await expect.poll(async () => (await appState(page)).count).toBe(200);
  for (const count of [300, 400, 500, 600, 650]) {
    await page.locator('.chat').evaluate((el) => {
      el.scrollTop = 600;
    });
    await expect.poll(async () => (await appState(page)).count).toBe(count);
  }
  expect((await appState(page)).older).toBe(false);
  const completed = requests.filter((r) => r.reverse && r.lastId).length;
  await page.locator('.chat').evaluate((el) => {
    el.scrollTop = 0;
  });
  await page.waitForTimeout(500);
  expect(requests.filter((r) => r.reverse && r.lastId).length).toBe(completed);
});

test('jumping from dated history includes the latest message and discards an in-flight page', async ({
  page,
}) => {
  historyDelay = 600;
  await openChat(page, `/?from=${encodeURIComponent(makeMessage(350).createdAt)}`);
  await expect(page.locator('.chat__jump')).toBeVisible();
  await expect.poll(() => requests.some((r) => !r.poll && r.lastId === 350 && !r.reverse)).toBe(true);
  await page.locator('.chat__jump').click();
  await expect.poll(async () => (await appState(page)).latest).toBe(650);
  await expect.poll(async () => (await appState(page)).bottom).toBeLessThan(2);
  await page.waitForTimeout(700);
  expect((await appState(page)).count).toBe(100);
  expect((await appState(page)).newer).toBe(false);
});

test('keeps the latest messages visible on a mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openChat(page);
  await expect.poll(async () => (await appState(page)).bottom).toBeLessThan(2);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  messages.push(makeMessage(651));
  await expect.poll(async () => (await appState(page)).latest).toBe(651);
  await expect.poll(async () => (await appState(page)).bottom).toBeLessThan(2);
});

test('replays messages after the requested time without overlapping history requests', async ({ page }) => {
  const first = makeMessage(1);
  const secondTime = new Date(Date.parse(first.createdAt) + 1000).toISOString();
  messages = [first, { ...makeMessage(2), createdAt: secondTime, updatedAt: secondTime }];
  await openChat(page, `/?play=true&from=${encodeURIComponent(first.createdAt)}`);
  await expect(page.locator('[data-message-id="1"]')).toBeAttached();
  await expect(page.locator('[data-message-id="2"]')).toBeAttached();
  await expect.poll(async () => (await appState(page)).bottom).toBeLessThan(2);
  expect(requests.filter((r) => !r.poll && !r.reverse).length).toBe(1);
});

test('opens a pinned poll outside loaded history and returns to the latest messages', async ({ page }) => {
  messages[119] = makePoll(120);
  await openChat(page);
  const pinned = page.locator('.pinned-polls');
  await expect(pinned.locator('strong')).toHaveText('Formatted');
  await expect(page.locator('[data-message-id="120"]')).toHaveCount(0);
  historyDelay = 500;
  await page.locator('.chat').evaluate((el) => {
    el.scrollTop = 600;
  });
  await expect.poll(() => requests.some((r) => r.lastId === 551 && r.reverse && !r.poll)).toBe(true);
  await pinned.locator('button').click();
  const poll = page.locator('[data-message-id="120"]');
  await expect(poll).toBeVisible();
  await expect(poll).toHaveClass(/chat__message_state_highlighted/);
  await expect(poll.locator('.message-poll__question strong')).toHaveText('Formatted');
  await expect(poll.locator('.poll-single-choice em')).toHaveText('First');
  await expect.poll(async () => (await appState(page)).count).toBe(99);
  await page.locator('.chat__jump').click();
  await expect.poll(async () => (await appState(page)).latest).toBe(650);
  await expect.poll(async () => (await appState(page)).bottom).toBeLessThan(2);
  await expect(page.locator('.chat__jump')).toHaveCount(0);
});

test('renders results for an active poll in OBS mode', async ({ page }) => {
  messages[649] = makePoll(650);
  await openChat(page, '/?style=obs');
  await expect(page.locator('.pinned-polls')).toHaveCount(0);
  const poll = page.locator('[data-message-id="650"]');
  await expect(poll.locator('.poll-results')).toBeVisible();
  await expect(poll.locator('.poll-result-item__answer em')).toHaveText('First');
  await expect(poll.locator('.poll-single-choice')).toHaveCount(0);
});

test('edits formatted polls with single-line rich inputs and validates plain text', async ({ page }) => {
  await openChat(page, '/poll');
  const question = page.locator('#poll-question');
  await expect(question).toBeFocused();
  await expect(page.locator('.poll-modal button[type="submit"]')).toBeDisabled();
  await question.fill('Formatted question');
  await question.press('ControlOrMeta+a');
  await expect(page.getByRole('button', { name: 'Жирный', exact: true, includeHidden: true })).toBeAttached();
  await question.press('ControlOrMeta+b');
  const first = page.locator('#poll-option-0');
  const second = page.locator('#poll-option-1');
  await first.fill('Same answer');
  await second.fill('Same answer');
  await second.press('ControlOrMeta+a');
  await second.press('ControlOrMeta+i');
  const publish = page.locator('.poll-modal button[type="submit"]');
  await expect(publish).toBeDisabled();
  await second.fill('Different answer');
  await second.press('Shift+Enter');
  await expect(second.locator('p')).toHaveCount(1);
  await expect(publish).toBeEnabled();
  await publish.click();
  await expect.poll(() => createdPoll?.question).toContain('<strong>Formatted question</strong>');
  expect(createdPoll.options).toHaveLength(2);
  await expect(page.locator('.poll-modal')).toHaveCount(0);
});

test('hydrates consistently when the server language differs from navigator.language', async ({ browser }) => {
  const context = await browser.newContext({
    locale: 'ru-RU',
  });
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'language', { get: () => 'en-US' });
  });
  const errors = [];
  const page = await context.newPage();
  page.on('pageerror', (error) => {
    errors.push(error.message);
  });
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  try {
    await openChat(page);
    await expect(page.locator('.chat')).toHaveAttribute('aria-label', 'Сообщения чата');
    expect(errors).toEqual([]);
  } finally {
    await context.close();
  }
});

test('pastes formatted HTML without modern DOM serialization or replacement APIs', async ({ page }) => {
  await page.addInitScript(() => {
    Reflect.deleteProperty(Element.prototype, 'getHTML');
    Reflect.deleteProperty(Element.prototype, 'replaceWith');
  });
  await openChat(page, '/poll');
  const question = page.locator('#poll-question');
  await question.focus();
  await question.evaluate((element) => {
    const data = new DataTransfer();
    data.setData('text/html', '<div>Hello <strong>world</strong></div><p>Second line</p>');
    data.setData('text/plain', 'Hello world\nSecond line');
    element.dispatchEvent(new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true }));
  });
  await expect(question).toHaveText('Hello world Second line');
  await expect(question.locator('strong')).toHaveText('world');
  await expect(question.locator('p')).toHaveCount(1);
});

test('can retry an unresolved session and sign out using the profile menu', async ({ page }) => {
  rejectSession = true;
  await openChat(page, '/login');
  await expect(page.getByRole('alert')).toContainText('Не удалось проверить сессию');
  await expect(page).toHaveURL(/\/login$/);
  rejectSession = false;
  await page.getByRole('button', { name: 'Повторить', exact: true }).click();
  await expect(page.locator('.aside-footer__username')).toHaveText('ScrollTester');
  await expect(page).toHaveURL(`${origin}/`);
  const trigger = page.getByRole('button', { name: 'Меню профиля' });
  await trigger.focus();
  await trigger.press('ArrowDown');
  await expect(page.getByRole('menuitem', { name: 'Профиль', exact: true })).toBeFocused();
  await page.getByRole('menuitem', { name: 'Выйти', exact: true }).click();
  await expect(page.locator('.aside-footer')).toHaveCount(0);
});

test('selects a setting with keyboard navigation through Reka Select', async ({ page }) => {
  await openChat(page, '/settings');
  const select = page.getByRole('combobox');
  await select.focus();
  await select.press('ArrowDown');
  await page.getByRole('option').nth(1)
    .click();
  await expect(select).toBeFocused();
  await expect(page.getByRole('listbox')).toHaveCount(0);
});

test('uploads pictures with authenticated XHR progress and reports upload errors', async ({ page }) => {
  let isRejectUpload = true;
  let uploads = 0;
  let isFailNetwork = false;
  await page.route('**/upload/image', async (route) => {
    uploads++;
    if (isFailNetwork) return route.abort('failed');
    expect(route.request().headers().authorization).toBe('Bearer test-token');
    expect(route.request().headers()['content-type']).toContain('multipart/form-data');
    expect(route.request().postDataBuffer()
      .toString()).toContain('filename="picture.png"');
    await route.fulfill({
      status: isRejectUpload ? 422 : 200,
      contentType: 'application/json',
      body: JSON.stringify(isRejectUpload ? { message: 'Image rejected' } : { id: 77 }),
    });
  });
  await openChat(page);
  async function attachPicture() {
    const chooser = page.waitForEvent('filechooser');
    await page.locator('.footer__attach-button').click();
    await (await chooser).setFiles({
      name: 'picture.png',
      mimeType: 'image/png',
      buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jY1sAAAAASUVORK5CYII=', 'base64'),
    });
  }
  await attachPicture();
  await expect(page.locator('.notification')).toContainText('Image rejected');
  await expect(page.locator('.footer__progress-bar')).toHaveCount(0);
  await page.getByRole('button', { name: 'Закрыть уведомление' }).click();
  isRejectUpload = false;
  const createMessage = page.waitForRequest((request) => request.method() === 'POST' && request.url().includes('/graphql')
    && request.postDataJSON()?.operationName === 'CreateMessage');
  await attachPicture();
  expect((await createMessage).postDataJSON().variables.pictures).toEqual([77]);
  await expect(page.locator('.footer__progress-bar')).toHaveCount(0);
  expect(uploads).toBe(2);
  isFailNetwork = true;
  await attachPicture();
  await expect(page.locator('.notification')).toContainText('Не удалось загрузить изображение');
  await expect(page.locator('.footer__progress-bar')).toHaveCount(0);
});

test('keeps editor focus while selecting a Tiptap mention from its Reka popup', async ({ page }) => {
  await openChat(page);
  const editor = page.locator('.footer [contenteditable="true"]');
  await editor.fill('@Scroll');
  await expect(page.locator('.mention-list')).toContainText('ScrollTester');
  await expect(editor).toBeFocused();
  await editor.press('ArrowDown');
  await editor.press('Enter');
  await expect(editor.locator('mention')).toHaveAttribute('data-id', '42');
  await expect(page.locator('.mention-list')).toHaveCount(0);
  await expect(editor).toBeFocused();
  await editor.press('Backspace');
  await editor.press('Backspace');
  await expect(editor.locator('mention')).toHaveCount(0);
  await expect(editor).toHaveText('@');
});

test('refreshes chat data and resumes polling after returning from another page', async ({ page }) => {
  await openChat(page);
  await page.evaluate(async () => {
    await document.querySelector('#__nuxt').__vue_app__.config.globalProperties.$nuxt.$router.replace('/reset_password');
  });
  await expect(page.getByRole('link', { name: 'Вернуться в чат' })).toBeVisible();
  messages.find((message) => message.id === 650).content = '<p>Changed while outside chat</p>';
  const requestsBeforeReturn = requests.filter((request) => request.poll).length;
  await page.getByRole('link', { name: 'Вернуться в чат' }).click();
  await expect(page.locator('.chat')).toContainText('Changed while outside chat');
  await expect.poll(() => requests.filter((request) => request.poll).length).toBeGreaterThan(requestsBeforeReturn);
  await expect.poll(async () => (await appState(page)).bottom).toBeLessThan(2);
});

test('formats a poll with the selection toolbar without dismissing its dialog', async ({ page }) => {
  await openChat(page, '/poll');
  const question = page.locator('#poll-question');
  await question.fill('Toolbar formatting');
  await question.press('ControlOrMeta+a');
  const bold = page.getByRole('button', { name: 'Жирный', exact: true });
  await expect(bold).toBeVisible();
  await bold.click();
  await expect(page.locator('.poll-modal')).toBeVisible();
  await expect(question.locator('strong')).toHaveText('Toolbar formatting');
  await expect(bold).toHaveClass(/bubble-button_state_active/);
  await expect(question).toBeFocused();
});

test('formats a chat message with the selection toolbar above the chat', async ({ page }) => {
  await openChat(page);
  const composer = page.locator('.footer [contenteditable=true]');
  await composer.fill('Chat toolbar formatting');
  await composer.press('ControlOrMeta+a');
  const bold = page.getByRole('button', { name: 'Жирный', exact: true });
  await bold.click();
  await expect(composer.locator('strong')).toHaveText('Chat toolbar formatting');
  await expect(composer).toBeFocused();
});

test('opens the message context menu at the pointer and loads its content for editing', async ({ page }) => {
  await openChat(page);
  await page.locator('[data-message-id="650"] .message').click({ button: 'right' });
  await page.getByRole('menuitem', { name: 'Изменить сообщение', exact: true }).click();
  await expect(page.locator('.footer [contenteditable=true]')).toHaveText('Message 650');
  await expect(page.locator('.edited-message-preview')).toBeVisible();
});

test('retains a failed send and retries with the same client identity', async ({ page }) => {
  const sent = [];
  let isReject = true;
  await page.route('**/graphql*', async (route) => {
    if (route.request().postDataJSON()?.operationName !== 'CreateMessage') return route.continue();
    sent.push(route.request().postDataJSON().variables);
    if (isReject) return route.abort('failed');
    return route.continue();
  });
  await openChat(page);
  const editor = page.locator('.footer [contenteditable=true]');
  await editor.fill('Recover this draft');
  await editor.press('Enter');
  const retry = page.getByRole('button', { name: 'Повторить отправку' });
  await expect(retry).toBeVisible();
  await expect(editor).toHaveText('Recover this draft');
  await expect(page.locator('.message_state_not-delivered')).toHaveCount(0);
  isReject = false;
  await retry.click();
  await expect(editor).toHaveText('');
  await expect(page.locator('.chat__message').filter({ hasText: 'Recover this draft' })).toHaveCount(1);
  expect(sent[0].randomId).toBe(sent[1].randomId);
});

test('a successful send leaves a newer draft intact', async ({ page }) => {
  const { promise: arrived, resolve: intercepted } = Promise.withResolvers();
  const { promise: response, resolve: release } = Promise.withResolvers();
  await page.route('**/graphql*', async (route) => {
    if (route.request().postDataJSON()?.operationName !== 'CreateMessage') return route.continue();
    intercepted();
    await response;
    return route.continue();
  });
  await openChat(page);
  const editor = page.locator('.footer [contenteditable=true]');
  await editor.fill('First draft');
  await editor.press('Enter');
  await arrived;
  await editor.fill('New draft while sending');
  release();
  await expect(page.locator('.footer__send-button')).toBeEnabled();
  await expect(editor).toHaveText('New draft while sending');
});

test('a rejected edit can be retried without losing its text or the saved draft', async ({ page }) => {
  rejectEdit = true;
  await openChat(page);
  const editor = page.locator('.footer [contenteditable=true]');
  await editor.fill('Unsent draft');
  await page.locator('[data-message-id="650"] .message').click({ button: 'right' });
  await page.getByRole('menuitem', { name: 'Изменить сообщение', exact: true }).click();
  await editor.fill('Recover this edit');
  await editor.press('Enter');
  await expect(page.locator('.footer [role=alert]')).toContainText('Edit rejected');
  await expect(page.locator('.edited-message-preview')).toBeVisible();
  await expect(editor).toHaveText('Recover this edit');
  rejectEdit = false;
  await page.getByRole('button', { name: 'Повторить отправку' }).click();
  await expect(page.locator('.edited-message-preview')).toHaveCount(0);
  await expect(editor).toHaveText('Unsent draft');
  await expect(page.locator('[data-message-id="650"]')).toContainText('Recover this edit');
});

test('only an empty focused composer handles the edit shortcut', async ({ page }) => {
  await openChat(page);
  const editor = page.locator('.footer [contenteditable=true]');
  await editor.fill('Keep this draft');
  await editor.press('ArrowUp');
  await expect(page.locator('.edited-message-preview')).toHaveCount(0);
  await editor.fill('@Scroll');
  await expect(page.locator('.mention-list')).toBeVisible();
  await editor.press('ArrowUp');
  await expect(page.locator('.edited-message-preview')).toHaveCount(0);
  await editor.press('Escape');
  await editor.fill('');
  await editor.press('ArrowUp');
  await expect(page.locator('.edited-message-preview')).toBeVisible();
  await editor.press('Escape');
  await expect(page.locator('.edited-message-preview')).toHaveCount(0);
  await page.goto(`${origin}/settings`);
  await page.locator('.select__title').click();
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('Enter');
  await expect(page.locator('.edited-message-preview')).toHaveCount(0);
});

test('context menus use actual ownership and grants for each action', async ({ page }) => {
  userRole = 'USER';
  messages.at(-1).owner = { ...owner, id: 99, username: 'AnotherUser' };
  await openChat(page);
  await page.locator('[data-message-id="650"] .message').click({ button: 'right' });
  await expect(page.getByRole('menuitem', { name: 'Профиль', exact: true })).toBeVisible();
  await expect(page.getByRole('menuitem', { name: 'Изменить сообщение' })).toHaveCount(0);
  await expect(page.getByRole('menuitem', { name: 'Удалить сообщение' })).toHaveCount(0);
  await page.keyboard.press('Escape');
  await page.locator('[data-message-id="649"] .message').click({ button: 'right' });
  await expect(page.getByRole('menuitem', { name: 'Изменить сообщение' })).toBeVisible();
  await expect(page.getByRole('menuitem', { name: 'Удалить сообщение' })).toBeVisible();
});

test('guests can inspect profiles without receiving authenticated message actions', async ({ context, page }) => {
  await context.clearCookies();
  await context.addCookies([{ name: 'politics_restricted_showed', value: '1', url: origin }]);
  await openChat(page);
  await page.locator('[data-message-id="650"] .message').click({ button: 'right' });
  await expect(page.getByRole('menuitem', { name: 'Профиль', exact: true })).toBeVisible();
  await expect(page.getByRole('menuitem', { name: 'Ответить', exact: true })).toHaveCount(0);
  await expect(page.getByRole('menuitem', { name: 'Изменить сообщение' })).toHaveCount(0);
  await expect(page.getByRole('menuitem', { name: 'Удалить сообщение' })).toHaveCount(0);
});

test('email confirmation refreshes the matching session before returning to chat', async ({ page }) => {
  emailConfirmed = false;
  await openChat(page);
  await expect(page.locator('.page__reminder')).toBeVisible();
  await page.evaluate(async () => {
    await document.querySelector('#__nuxt').__vue_app__.config.globalProperties.$nuxt.$router.replace('/confirm_email?code=matching-account');
  });
  await expect(page.locator('.email-confirmed-modal')).toBeVisible();
  await page.locator('.email-confirmed-modal__button').click();
  await expect(page.locator('.page__reminder')).toHaveCount(0);
  await expect(page.locator('.footer [contenteditable=true]')).toBeVisible();
});

test('confirming another account preserves the current session', async ({ page }) => {
  emailConfirmed = false;
  confirmationOwnerId = 99;
  await openChat(page);
  await page.evaluate(async () => {
    await document.querySelector('#__nuxt').__vue_app__.config.globalProperties.$nuxt.$router.replace('/confirm_email?code=another-account');
  });
  await expect(page.locator('.email-confirmed-modal')).toBeVisible();
  await expect(page.locator('.aside-footer__username')).toHaveText('ScrollTester');
  await expect(page.locator('.page__reminder')).toBeVisible();
});

test('guest confirmation does not sign in to the confirmed account', async ({ context, page }) => {
  await context.clearCookies();
  await context.addCookies([{ name: 'politics_restricted_showed', value: '1', url: origin }]);
  await page.goto(`${origin}/confirm_email?code=guest-account`);
  await expect(page.locator('.email-confirmed-modal')).toBeVisible();
  await expect(page.locator('.aside-footer')).toHaveCount(0);
});

test('file-based routes preserve named URLs and profile loading on direct navigation', async ({ page }) => {
  await openChat(page, '/profile/42');
  await expect(page.locator('.profile-modal__username')).toHaveText('ScrollTester');
  const urls = await page.evaluate(() => {
    const router = document.querySelector('#__nuxt').__vue_app__.config.globalProperties.$nuxt.$router;
    return Object.fromEntries([
      ['main', undefined],
      ['modal_login', undefined],
      ['modal_register', undefined],
      ['modal_settings', undefined],
      ['modal_poll', undefined],
      ['modal_poll_edit', { id: 42 }],
      ['modal_profile', { id: 42 }],
      ['modal_punishment', { id: 42 }],
      ['modal_request_password_reset', undefined],
      ['modal_request_email_confirmation', undefined],
      ['modal_email_confirmed', undefined],
      ['confirm_email', undefined],
      ['reset_password', undefined],
      ['oauth_discord', undefined],
    ].map(([name, params]) => [name, router.resolve({ name, params }).path]));
  });
  expect(urls).toEqual({
    main: '/',
    modal_login: '/login',
    modal_register: '/register',
    modal_settings: '/settings',
    modal_poll: '/poll',
    modal_poll_edit: '/poll/42/edit',
    modal_profile: '/profile/42',
    modal_punishment: '/profile/42/punish',
    modal_request_password_reset: '/request_password_reset',
    modal_request_email_confirmation: '/request_email_confirmation',
    modal_email_confirmed: '/email_confirmed',
    confirm_email: '/confirm_email',
    reset_password: '/reset_password',
    oauth_discord: '/oauth/discord',
  });
});

test('retrying a rejected image message reuses the uploaded attachment', async ({ page }) => {
  let uploads = 0;
  const submissions = [];
  rejectMessage = true;
  await page.route('**/upload/image', async (route) => {
    uploads++;
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 77 }) });
  });
  page.on('request', (request) => {
    if (request.method() === 'POST' && request.url().includes('/graphql')
      && request.postDataJSON()?.operationName === 'CreateMessage') {
      submissions.push(request.postDataJSON().variables);
    }
  });
  await openChat(page);
  const chooser = page.waitForEvent('filechooser');
  await page.locator('.footer__attach-button').click();
  await (await chooser).setFiles({ name: 'picture.png', mimeType: 'image/png', buffer: Buffer.from('image fixture') });
  await expect(page.locator('.footer [role=alert]')).toContainText('Message rejected');
  rejectMessage = false;
  await page.getByRole('button', { name: 'Повторить отправку' }).click();
  await expect(page.locator('.footer [role=alert]')).toHaveCount(0);
  expect(uploads).toBe(1);
  expect(submissions.map(({ pictures }) => pictures)).toEqual([[77], [77]]);
  expect(submissions[0].randomId).toBe(submissions[1].randomId);
});

test('a session refresh cannot reuse or apply an earlier active-poll response', async ({ page }) => {
  const { promise: arrived, resolve: intercepted } = Promise.withResolvers();
  const { promise: response, resolve: release } = Promise.withResolvers();
  let isHold = false;
  let isHeld = false;
  let freshRequests = 0;
  await page.route('**/graphql*', async (route) => {
    if (route.request().postDataJSON()?.operationName !== 'GetActivePolls' || !isHold) return route.continue();
    if (!isHeld) {
      isHeld = true;
      intercepted();
      await response;
      return route.fulfill({
        status: 200, contentType: 'application/json', body: JSON.stringify({ data: { getActivePolls: [makePoll(999)] } }),
      });
    }
    freshRequests++;
    return route.continue();
  });
  await openChat(page);
  isHold = true;
  await page.evaluate(() => {
    const pinia = document.querySelector('#__nuxt').__vue_app__.config.globalProperties.$pinia;
    Object.defineProperty(globalThis, 'previousPollRefresh', {
      configurable: true,
      value: pinia._s.get('messages').fetchActivePolls(),
    });
  });
  await arrived;
  await page.evaluate(async () => {
    const pinia = document.querySelector('#__nuxt').__vue_app__.config.globalProperties.$pinia;
    await pinia._s.get('auth').initialize();
  });
  await expect.poll(() => freshRequests).toBeGreaterThan(0);
  release();
  await page.evaluate(async () => {
    await globalThis.previousPollRefresh;
  });
  const polls = await page.evaluate(() => document.querySelector('#__nuxt').__vue_app__.config.globalProperties.$pinia._s.get('messages').activePolls.map(({ id }) => id));
  expect(polls).not.toContain(999);
});
