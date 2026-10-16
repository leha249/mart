import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    '❌ Не найдены переменные Supabase. Проверь файл .env.local в корне проекта.'
  );
}

export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
    timeout: 20000,
  },
  global: {
    headers: {
      'x-application-name': 'mora-mart',
    },
  },
  db: {
    schema: 'public',
  },
});