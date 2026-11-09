/**
 * Проверка UI через CDP: поднимается headless Chrome (запускается отдельно),
 * скрипт открывает страницы, собирает ошибки консоли и делает скриншоты.
 *
 * Запуск: node scripts/cdp-check.mjs <baseUrl> <outDir>
 */

const BASE = process.argv[2] ?? 'http://127.0.0.1:4173';
const OUT = process.argv[3] ?? '.';
const DEBUG_PORT = 9222;

import { writeFileSync } from 'node:fs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const connect = async () => {
  const list = await (await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/list`)).json();
  const page = list.find((t) => t.type === 'page');
  if (!page) throw new Error('нет вкладки для отладки');

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let seq = 0;
  const pending = new Map();
  const logs = [];

  ws.addEventListener('message', (e) => {
    const msg = JSON.parse(e.data);
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg);
      pending.delete(msg.id);
    } else if (msg.method) {
      logs.push(msg);
    }
  });

  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true });
    ws.addEventListener('error', reject, { once: true });
  });

  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = ++seq;
      pending.set(id, (msg) =>
        msg.error ? reject(new Error(`${method}: ${JSON.stringify(msg.error)}`)) : resolve(msg.result)
      );
      ws.send(JSON.stringify({ id, method, params }));
    });

  return { send, logs, close: () => ws.close() };
};

const main = async () => {
  const { send, logs, close } = await connect();

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Log.enable');

  const navigate = async (url, waitMs = 2200) => {
    await send('Page.navigate', { url });
    await sleep(waitMs);
  };

  const evaluate = async (expression) => {
    const res = await send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (res.exceptionDetails) {
      throw new Error(`evaluate: ${JSON.stringify(res.exceptionDetails.text)}`);
    }
    return res.result.value;
  };

  const shot = async (name) => {
    const { data } = await send('Page.captureScreenshot', { format: 'png' });
    writeFileSync(`${OUT}/${name}.png`, Buffer.from(data, 'base64'));
  };

  const metrics = (width, height, mobile = false) =>
    send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile,
    });

  const errors = () =>
    logs
      .filter(
        (m) =>
          (m.method === 'Runtime.exceptionThrown' &&
            m.params?.exceptionDetails?.exception?.description) ||
          (m.method === 'Runtime.consoleAPICalled' &&
            m.params?.type === 'error' &&
            m.params.args?.map((a) => a.value ?? a.description).join(' ')) ||
          (m.method === 'Log.entryAdded' &&
            m.params?.entry?.level === 'error' &&
            m.params.entry.text)
      )
      .map(
        (m) =>
          m.params?.exceptionDetails?.exception?.description ??
          (m.params?.args ? m.params.args.map((a) => a.value ?? a.description).join(' ') : null) ??
          m.params?.entry?.text
      );

  // --- 1. Заселяем localStorage перед проверкой кабинета ---
  await metrics(1280, 900);
  await navigate(`${BASE}/`, 1800);

  await evaluate(`
    localStorage.setItem('mora-customer-session-v1', JSON.stringify({
      phone: '79005553535',
      firstName: 'Тест',
      lastName: 'Покупатель',
      name: 'Тест Покупатель',
      verifiedAt: new Date().toISOString()
    }));
    localStorage.setItem('mora-chat-tokens-v1', JSON.stringify({
      '2': { threadId: 999999, token: '11111111-1111-1111-1111-111111111111' }
    }));
    localStorage.setItem('mora-chat-seen-v1', '{}');
    localStorage.setItem('mora-cookie-consent-v1', JSON.stringify({
      accepted: true,
      necessary: true,
      analytics: false,
      marketing: false,
      at: new Date().toISOString()
    }));
    'ok';
  `);

  // --- 2. Кабинет ---
  await navigate(`${BASE}/account`, 2600);
  const account = await evaluate(`
    (() => {
      const section = document.getElementById('chats');
      return {
        hasSection: Boolean(section),
        heading: section?.querySelector('h2')?.innerText ?? null,
        rows: section ? [...section.querySelectorAll('button')].map(b => b.innerText.replace(/\\n+/g, ' | ')).slice(0, 6) : [],
        text: (section?.innerText ?? '').slice(0, 600),
        errorsOnPage: document.body.innerText.includes('Не удалось загрузить чаты')
      };
    })()
  `);
  await shot('account-desktop');
  await evaluate(`document.getElementById('chats')?.scrollIntoView({ block: 'center' }); 'ok'`);
  await sleep(700);
  await shot('chats-desktop');

  // --- 3. Открываем чат из строки ---
  const opened = await evaluate(`
    (() => {
      const section = document.getElementById('chats');
      if (!section) return 'no-section';
      const row = [...section.querySelectorAll('button')].find(b => b.innerText.includes('paypalich'));
      if (!row) return 'no-row';
      row.click();
      return 'clicked';
    })()
  `);
  await sleep(2600);
  const panel = await evaluate(`
    (() => {
      const p = document.querySelector('.mora-chat-panel');
      return {
        present: Boolean(p),
        title: p?.innerText.split('\\n').slice(0, 2).join(' | ') ?? null,
        hasInput: Boolean(p?.querySelector('input')),
        initError: (p?.innerText ?? '').includes('Не удалось открыть чат')
      };
    })()
  `);
  await shot('chat-panel-desktop');

  // --- 4. Меню-бургер: есть ли «Мои чаты» ---
  await evaluate(`document.querySelector('.mobile-menu-btn')?.click(); 'ok'`);
  await sleep(900);
  const menu = await evaluate(`
    (() => {
      const text = document.body.innerText;
      return { hasChatsItem: text.includes('Мои чаты'), snippet: text.split('\\n').filter(l => l.includes('чаты')).slice(0,3) };
    })()
  `);
  await shot('menu-desktop');

  // --- 5. Телефон ---
  await metrics(390, 844, true);
  await navigate(`${BASE}/account`, 2600);
  const accountMobile = await evaluate(`
    (() => {
      const section = document.getElementById('chats');
      const docWidth = document.documentElement.scrollWidth;
      return {
        hasSection: Boolean(section),
        overflowX: docWidth > window.innerWidth + 1,
        docWidth,
        viewport: window.innerWidth
      };
    })()
  `);
  await shot('account-mobile');

  await evaluate(`document.getElementById('chats')?.scrollIntoView({ block: 'center' }); 'ok'`);
  await sleep(600);
  await shot('chats-mobile');

  await evaluate(`
    (() => {
      const s = document.getElementById('chats');
      const row = s && [...s.querySelectorAll('button')].find(b => b.innerText.includes('paypalich'));
      row?.click();
      return 'ok';
    })()
  `);
  await sleep(2400);
  const mobilePanel = await evaluate(`
    (() => {
      const p = document.querySelector('.mora-chat-panel');
      const r = p?.getBoundingClientRect();
      return {
        present: Boolean(p),
        width: Math.round(r?.width ?? 0),
        height: Math.round(r?.height ?? 0),
        viewport: [window.innerWidth, window.innerHeight]
      };
    })()
  `);
  await shot('chat-panel-mobile');

  // --- 6. Страница товара: кнопка чата у гостя показывает быструю регистрацию ---
  await metrics(1280, 900);
  await navigate(`${BASE}/product/rick-owens-x-drkshdw`, 2600);
  await evaluate(`localStorage.removeItem('mora-customer-session-v1'); 'ok'`);
  await navigate(`${BASE}/product/rick-owens-x-drkshdw`, 2600);
  const productChat = await evaluate(`
    (() => {
      const btn = [...document.querySelectorAll('button')].find(b => /Написать продавцу/i.test(b.innerText));
      if (!btn) return { found: false };
      btn.click();
      return { found: true };
    })()
  `);
  await sleep(1500);
  const productPanel = await evaluate(`
    (() => {
      const p = document.querySelector('.mora-chat-panel');
      const text = p?.innerText ?? '';
      return {
        present: Boolean(p),
        askRegister: text.includes('Начать чат'),
        hasRegisterFields: Boolean(p && p.querySelectorAll('input').length >= 3)
      };
    })()
  `);
  await shot('chat-guest-mobile-or-desktop');

  const results = {
    account,
    opened,
    panel,
    menu,
    accountMobile,
    mobilePanel,
    productChat,
    productPanel,
    errors: errors(),
  };

  console.log(JSON.stringify(results, null, 2));
  close();
};

main().catch((e) => {
  console.error('FAILED:', e.message);
  process.exit(1);
});
