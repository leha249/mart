#!/usr/bin/env node
/**
 * Применяет SQL-файл к проекту Supabase через Management API,
 * отправляя операторы по одному (API не переваривает большие
 * мульти-скрипты с DDL).
 *
 * Разбор корректно пропускает ';' внутри:
 *   - dollar-quoted блоков ($$ ... $$, $fn$ ... $fn$),
 *   - строк в одинарных и двойных кавычках,
 *   - комментариев -- и /* *\/.
 *
 * Запуск: node scripts/apply-sql.mjs <file.sql> <project-ref> <pat>
 */

import { readFile } from 'node:fs/promises';

const [, , file, ref, pat] = process.argv;
if (!file || !ref || !pat) {
  console.error('usage: node scripts/apply-sql.mjs <file.sql> <ref> <pat>');
  process.exit(1);
}

/** Разбить SQL на операторы верхнего уровня. */
export const splitSql = (sql) => {
  const out = [];
  let buf = '';
  let i = 0;
  let dollarTag = null;
  let inSingle = false;
  let inDouble = false;
  let inLineComment = false;
  let inBlockComment = false;

  while (i < sql.length) {
    const ch = sql[i];
    const next = sql[i + 1];

    if (inLineComment) {
      buf += ch;
      if (ch === '\n') inLineComment = false;
      i += 1;
      continue;
    }

    if (inBlockComment) {
      buf += ch;
      if (ch === '*' && next === '/') {
        buf += next;
        i += 2;
        inBlockComment = false;
        continue;
      }
      i += 1;
      continue;
    }

    if (dollarTag) {
      if (sql.startsWith(dollarTag, i)) {
        buf += dollarTag;
        i += dollarTag.length;
        dollarTag = null;
        continue;
      }
      buf += ch;
      i += 1;
      continue;
    }

    if (inSingle) {
      buf += ch;
      if (ch === "'" && next === "'") {
        buf += next;
        i += 2;
        continue;
      }
      if (ch === "'") inSingle = false;
      i += 1;
      continue;
    }

    if (inDouble) {
      buf += ch;
      if (ch === '"') inDouble = false;
      i += 1;
      continue;
    }

    // Комментарии и кавычки
    if (ch === '-' && next === '-') {
      inLineComment = true;
      buf += ch;
      i += 1;
      continue;
    }
    if (ch === '/' && next === '*') {
      inBlockComment = true;
      buf += ch + next;
      i += 2;
      continue;
    }
    if (ch === "'") {
      inSingle = true;
      buf += ch;
      i += 1;
      continue;
    }
    if (ch === '"') {
      inDouble = true;
      buf += ch;
      i += 1;
      continue;
    }

    // Начало dollar-quoted блока: $tag$
    if (ch === '$') {
      const match = /^\$[A-Za-z_]*\$/.exec(sql.slice(i));
      if (match) {
        dollarTag = match[0];
        buf += dollarTag;
        i += dollarTag.length;
        continue;
      }
    }

    if (ch === ';') {
      const stmt = buf.trim();
      if (stmt) out.push(stmt);
      buf = '';
      i += 1;
      continue;
    }

    buf += ch;
    i += 1;
  }

  const tail = buf.trim();
  if (tail) out.push(tail);
  return out;
};

const main = async () => {
  const sql = await readFile(file, 'utf8');
  const statements = splitSql(sql);
  console.log(`операторов: ${statements.length}`);

  for (let idx = 0; idx < statements.length; idx += 1) {
    const stmt = statements[idx];
    const head = stmt.split('\n')[0].slice(0, 70).replace(/\s+/g, ' ');

    const res = await fetch(
      `https://api.supabase.com/v1/projects/${ref}/database/query`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${pat}`,
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify({ query: stmt }),
      }
    );

    if (!res.ok) {
      const body = await res.text();
      console.error(`\n[${idx + 1}/${statements.length}] FAIL: ${head}`);
      console.error(body);
      process.exit(1);
    }

    console.log(`[${idx + 1}/${statements.length}] ok: ${head}`);
  }

  console.log('готово');
};

main().catch((e) => {
  console.error('FAILED:', e.message);
  process.exit(1);
});
