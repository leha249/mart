import { supabase } from '../lib/supabase';
import { normalizeError } from '../utils/errors';

export type ChatSender = 'customer' | 'seller';

export interface ChatMessage {
  id: number;
  sender: ChatSender;
  body: string;
  created_at: string;
}

export interface ChatThread {
  id: number;
  seller_id: number;
  customer_phone: string;
  customer_name: string | null;
  last_message_at: string;
}

const TOKEN_KEY = 'mora-chat-tokens-v1';

interface StoredToken {
  threadId: number;
  token: string;
}

const readTokens = (): Record<string, StoredToken> => {
  try {
    const raw = localStorage.getItem(TOKEN_KEY);
    return raw ? (JSON.parse(raw) as Record<string, StoredToken>) : {};
  } catch {
    return {};
  }
};

const saveToken = (sellerId: number, value: StoredToken) => {
  try {
    const all = readTokens();
    all[String(sellerId)] = value;
    localStorage.setItem(TOKEN_KEY, JSON.stringify(all));
  } catch {
    /* localStorage недоступен — чат откроется заново */
  }
};

export const getStoredToken = (sellerId: number): StoredToken | null =>
  readTokens()[String(sellerId)] ?? null;

export const chatService = {
  /** Открыть чат покупателя с продавцом (создаёт тред при первом обращении). */
  async openForCustomer(
    sellerId: number,
    phone: string,
    name?: string
  ): Promise<{ threadId: number; token: string; sellerName: string | null }> {
    try {
      const { data, error } = await supabase.rpc('open_chat', {
        p_seller_id: sellerId,
        p_phone: phone,
        p_name: name ?? null,
        p_token: getStoredToken(sellerId)?.token ?? null,
      });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      if (!row) throw new Error('Чат недоступен');

      const result = {
        threadId: Number(row.thread_id),
        token: String(row.token),
        sellerName: (row.seller_name as string) ?? null,
      };
      saveToken(sellerId, { threadId: result.threadId, token: result.token });
      return result;
    } catch (e) {
      console.error('[chatService.openForCustomer]', e);
      throw normalizeError(e);
    }
  },

  /** Сообщения треда для покупателя (по токену). */
  async customerMessages(
    threadId: number,
    token: string
  ): Promise<ChatMessage[]> {
    try {
      const { data, error } = await supabase.rpc('chat_messages_by_token', {
        p_thread_id: threadId,
        p_token: token,
      });
      if (error) throw error;
      return (data ?? []) as ChatMessage[];
    } catch (e) {
      console.error('[chatService.customerMessages]', e);
      throw normalizeError(e);
    }
  },

  /** Отправить сообщение от покупателя. */
  async customerSend(
    threadId: number,
    token: string,
    body: string
  ): Promise<void> {
    try {
      const { error } = await supabase.rpc('send_chat_message', {
        p_thread_id: threadId,
        p_token: token,
        p_body: body,
      });
      if (error) throw error;
    } catch (e) {
      console.error('[chatService.customerSend]', e);
      throw normalizeError(e);
    }
  },

  /** Треды продавца (RLS: только свои). */
  async sellerThreads(): Promise<ChatThread[]> {
    try {
      const { data, error } = await supabase
        .from('chat_threads')
        .select('*')
        .order('last_message_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as ChatThread[];
    } catch (e) {
      console.error('[chatService.sellerThreads]', e);
      throw normalizeError(e);
    }
  },

  async sellerMessages(threadId: number): Promise<ChatMessage[]> {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('id, sender, body, created_at')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as ChatMessage[];
    } catch (e) {
      console.error('[chatService.sellerMessages]', e);
      throw normalizeError(e);
    }
  },

  async sellerSend(threadId: number, body: string): Promise<void> {
    try {
      const { error } = await supabase.from('chat_messages').insert({
        thread_id: threadId,
        sender: 'seller',
        body: body.trim().slice(0, 2000),
      });
      if (error) throw error;

      await supabase
        .from('chat_threads')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', threadId);
    } catch (e) {
      console.error('[chatService.sellerSend]', e);
      throw normalizeError(e);
    }
  },

  /** Пометить сообщения покупателя прочитанными (когда продавец открыл тред). */
  async markThreadRead(threadId: number): Promise<void> {
    try {
      await supabase
        .from('chat_messages')
        .update({ read_at: new Date().toISOString() })
        .eq('thread_id', threadId)
        .eq('sender', 'customer')
        .is('read_at', null);
    } catch {
      /* не критично */
    }
  },

  /** Сколько непрочитанных сообщений у продавца (для бейджа). */
  async unreadCount(): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('unread_chat_count');
      if (error) throw error;
      return Number(data) || 0;
    } catch {
      return 0;
    }
  },

  /** Непрочитанные по каждому треду — для списка диалогов. */
  async unreadByThread(): Promise<Record<number, number>> {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('thread_id')
        .eq('sender', 'customer')
        .is('read_at', null)
        .limit(500);
      if (error) throw error;

      const map: Record<number, number> = {};
      for (const row of data ?? []) {
        const id = Number((row as { thread_id: number }).thread_id);
        map[id] = (map[id] ?? 0) + 1;
      }
      return map;
    } catch {
      return {};
    }
  },
};
