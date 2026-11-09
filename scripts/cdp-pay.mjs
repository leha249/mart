/** Проверка блока оплаты: страница товара и «Заказ оформлен». */
const BASE = process.argv[2] ?? 'http://127.0.0.1:5173';
const OUT = process.argv[3] ?? '.';
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
await send('Emulation.setDeviceMetricsOverride', {
  width: 1280,
  height: 900,
  deviceScaleFactor: 1,
  mobile: false,
});

// Чистая сессия: убираем возможные прошлые ключи
await send('Page.navigate', { url: `${BASE}/` });
await sleep(2200);
await evaluate(`
  localStorage.setItem('mora-cookie-consent-v1', JSON.stringify({ accepted: true, necessary: true, analytics: false, marketing: false, at: new Date().toISOString() }));
  sessionStorage.clear();
  'ok';
`);

// 1. Страница товара — блок оплаты в карточке продавца
await send('Page.navigate', { url: `${BASE}/product/test-pay-product` });
await sleep(2800);
const product = await evaluate(`
  (() => {
    const link = [...document.querySelectorAll('a')].find(a => /Оплата напрямую продавцу/i.test(a.innerText));
    return {
      found: Boolean(link),
      href: link?.getAttribute('href') ?? null,
      target: link?.getAttribute('target') ?? null,
      disclaimer: (document.body.innerText.match(/чек об оплате/i) ? 'есть' : 'нет')
    };
  })()
`);
await shot('pay-product');

// 2. «Заказ оформлен» с заказом на тестового продавца
await evaluate(`
  sessionStorage.setItem('mora-last-orders', JSON.stringify({
    phone: '79005553535',
    name: 'Тест Покупатель',
    orders: [{ id: 801, total: 5000, itemsCount: 1, sellerId: 5 }],
    createdAt: new Date().toISOString()
  }));
  'ok';
`);
await send('Page.navigate', { url: `${BASE}/order-success` });
await sleep(3000);
const success = await evaluate(`
  (() => {
    const link = [...document.querySelectorAll('a')].find(a => /Оплатить/i.test(a.innerText));
    return {
      found: Boolean(link),
      text: link?.innerText.replace(/\\n+/g, ' ') ?? null,
      href: link?.getAttribute('href') ?? null,
      rel: link?.getAttribute('rel') ?? null,
      note: (document.body.innerText.match(/СБП по номеру[^\\n]*/) || [null])[0],
      checkLine: document.body.innerText.includes('Чек об оплате выдаёт продавец')
    };
  })()
`);
await shot('pay-order-success');

const errors = logs
  .filter(
    (m) =>
      (m.method === 'Runtime.exceptionThrown' && m.params?.exceptionDetails?.exception?.description) ||
      (m.method === 'Runtime.consoleAPICalled' && m.params?.type === 'error')
  )
  .map(
    (m) =>
      m.params?.exceptionDetails?.exception?.description ??
      m.params?.args?.map((a) => a.value ?? a.description).join(' ')
  );

console.log(JSON.stringify({ product, success, errors }, null, 2));
ws.close();
