/** Вход продавца через /sell: ожидаем редирект в /admin. */
const BASE = process.argv[2] ?? 'http://127.0.0.1:5173';
const OUT = process.argv[3] ?? '.';
const EMAIL = process.argv[4] ?? 'test-login@mora.local';
const PASS = process.argv[5] ?? 'TestPass123!';
const PORT = 9222;

import { writeFileSync } from 'node:fs';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
const page = list.find((t) => t.type === 'page');
const ws = new WebSocket(page.webSocketDebuggerUrl);
let seq = 0;
const pending = new Map();
const logs = [];

ws.addEventListener('message', (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) {
    pending.get(m.id)(m);
    pending.delete(m.id);
  } else if (m.method) logs.push(m);
});
await new Promise((r, j) => {
  ws.addEventListener('open', r, { once: true });
  ws.addEventListener('error', j, { once: true });
});

const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const id = ++seq;
    pending.set(id, (m) =>
      m.error ? reject(new Error(`${method}: ${JSON.stringify(m.error)}`)) : resolve(m.result)
    );
    ws.send(JSON.stringify({ id, method, params }));
  });

const evaluate = async (expression) => {
  const res = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (res.exceptionDetails) throw new Error(res.exceptionDetails.text);
  return res.result.value;
};
const shot = async (name) => {
  const { data } = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(`${OUT}/${name}.png`, Buffer.from(data, 'base64'));
};

await send('Page.enable');
await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });

await send('Page.navigate', { url: `${BASE}/sell` });
await sleep(2500);

const before = await evaluate(`location.pathname`);

// Заполняем форму и жмём «Продолжить»
const fillResult = await evaluate(`
  (() => {
    try {
      const setValue = (el, value) => {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(el, value);
        el.dispatchEvent(new Event('input', { bubbles: true }));
      };
      const inputs = [...document.querySelectorAll('input')];
      const login = inputs.find(i => i.type === 'text' || i.type === 'email' || i.autocomplete === 'username');
      if (!login) return 'no-login';
      setValue(login, ${JSON.stringify(EMAIL)});
      const passInput = inputs.find(i => i.autocomplete === 'current-password' || i.type === 'password');
      if (!passInput) return 'no-pass';
      setValue(passInput, ${JSON.stringify(PASS)});
      const btn = document.querySelector('.lg-submit') || [...document.querySelectorAll('button')].find(b => /Продолжить/i.test(b.innerText));
      if (!btn) return 'no-button';
      btn.click();
      return 'clicked';
    } catch (e) {
      return 'js-error: ' + (e && e.message);
    }
  })()
`);
console.log('fill:', fillResult);
await sleep(4500);

const after = await evaluate(`
  (() => ({
    path: location.pathname,
    hasCabinet: /Кабинет|Дашборд|Товары/i.test(document.body.innerText),
    errorText: (document.body.innerText.match(/не привязан[^\n]*|Не удалось[^\n]*|Ошибка[^\n]*/) || [null])[0],
    roleHint: document.body.innerText.includes('Кабинет продавца') ? 'seller' : (document.body.innerText.includes('модерац') ? 'pending' : 'unknown')
  }))()
`);
await shot('login-result');

const errors = logs
  .filter((m) => (m.method === 'Runtime.exceptionThrown' && m.params?.exceptionDetails?.exception?.description) ||
                 (m.method === 'Runtime.consoleAPICalled' && m.params?.type === 'error'))
  .map((m) => m.params?.exceptionDetails?.exception?.description ?? m.params?.args?.map((a) => a.value ?? a.description).join(' '));

console.log(JSON.stringify({ before, after, errors }, null, 2));
ws.close();
