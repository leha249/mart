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

/** Забыть тред: если продавец удалён, токен иначе висит мёртвым грузом. */
export const forgetToken = (sellerId: number) => {
  try {
    const all = readTokens();
    delete all[String(sellerId)];
    localStorage.setItem(TOKEN_KEY, JSON.stringify(all));
  } catch {
    /* ignore */
  }
};

/**
 * До какого сообщения покупатель дочитал тред (id последнего прочитанного).
 * Нужно, чтобы бейдж «пришёл ответ» гас после открытия чата, а не висел вечно.
 */
const SEEN_KEY = 'mora-chat-seen-v1';

const readSeen = (): Record<string, number> => {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    return raw ? (JSON.parse(raw) as Record<string, number>) : {};
  } catch {
    return {};
  }
};

export const markChatSeen = (sellerId: number, messageId: number) => {
  try {
    const all = readSeen();
    if ((all[String(sellerId)] ?? 0) >= messageId) return;
    all[String(sellerId)] = messageId;
    localStorage.setItem(SEEN_KEY, JSON.stringify(all));
  } catch {
    /* ignore */
  }
};

/** Сводка треда для списка «Мои чаты» в кабинете покупателя. */
export interface CustomerChat {
  sellerId: number;
  sellerName: string;
  sellerSlug: string | null;
  threadId: number;
  token: string;
  lastMessage: string | null;
  lastSender: ChatSender | null;
  lastAt: string | null;
  lastId: number | null;
  messagesCount: number;
  /** Последнее сообщение от продавца и покупатель его ещё не открывал. */
  unseen: boolean;
}

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

  /**
   * Все треды покупателя на этом устройстве: токены лежат в localStorage,
   * поэтому список собирается на клиенте — по телефону сервер треды не отдаёт.
   */
  async listCustomerChats(): Promise<CustomerChat[]> {
    const stored = readTokens();
    const entries = Object.entries(stored)
      .map(([key, value]) => ({
        sellerId: Number(key),
        threadId: Number(value?.threadId),
        token: value?.token,
      }))
      .filter(
        (e) =>
          Number.isFinite(e.sellerId) &&
          Number.isFinite(e.threadId) &&
          typeof e.token === 'string' &&
          e.token.length > 0
      );

    if (entries.length === 0) return [];

    // Названия магазинов — одним запросом через публичную вьюху.
    const sellers = new Map<number, { name: string; slug: string | null }>();
    try {
      const ids = [...new Set(entries.map((e) => e.sellerId))];
      const { data, error } = await supabase
        .from('sellers_public')
        .select('id, name, slug')
        .in('id', ids);
      if (error) throw error;
      for (const row of data ?? []) {
        const r = row as { id: number; name: string | null; slug: string | null };
        sellers.set(Number(r.id), {
          name: r.name?.trim() || 'Магазин',
          slug: r.slug ?? null,
        });
      }
    } catch (e) {
      // Без названий список всё равно полезен — не роняем его.
      console.warn('[chatService.listCustomerChats] sellers:', e);
    }

    const seen = readSeen();

    const chats = await Promise.all(
      entries.map(async (entry): Promise<CustomerChat> => {
        let messages: ChatMessage[] = [];
        try {
          const { data, error } = await supabase.rpc('chat_messages_by_token', {
            p_thread_id: entry.threadId,
            p_token: entry.token,
          });
          if (error) throw error;
          messages = (data ?? []) as ChatMessage[];
        } catch (e) {
          // Тред мог быть удалён вместе с продавцом — просто показываем пусто.
          console.warn('[chatService.listCustomerChats] thread:', e);
        }

        const last = messages.length ? messages[messages.length - 1] : null;
        const seller = sellers.get(entry.sellerId);
        const seenId = seen[String(entry.sellerId)] ?? 0;

        return {
          sellerId: entry.sellerId,
          sellerName: seller?.name ?? 'Магазин',
          sellerSlug: seller?.slug ?? null,
          threadId: entry.threadId,
          token: entry.token,
          lastMessage: last?.body ?? null,
          lastSender: last?.sender ?? null,
          lastAt: last?.created_at ?? null,
          lastId: last?.id ?? null,
          messagesCount: messages.length,
          unseen:
            Boolean(last) &&
            last!.sender === 'seller' &&
            Number(last!.id) > seenId,
        };
      })
    );

    return chats.sort((a, b) =>
      (b.lastAt ?? '').localeCompare(a.lastAt ?? '')
    );
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

  /** Треды продавца с последним сообщением — для списка диалогов. */
  async sellerThreadsWithPreview(): Promise<
    (ChatThread & {
      preview: string | null;
      previewSender: ChatSender | null;
    })[]
  > {
    const threads = await this.sellerThreads();
    if (threads.length === 0) return [];

    const previews = new Map<
      number,
      { body: string; sender: ChatSender }
    >();

    try {
      const ids = threads.map((t) => t.id);
      const { data, error } = await supabase
        .from('chat_messages')
        .select('thread_id, body, sender, created_at')
        .in('thread_id', ids)
        .order('created_at', { ascending: false })
        .limit(400);
      if (error) throw error;

      for (const row of data ?? []) {
        const r = row as {
          thread_id: number;
          body: string;
          sender: ChatSender;
        };
        const id = Number(r.thread_id);
        // Идём от свежих к старым — первое совпадение и есть последнее.
        if (!previews.has(id)) {
          previews.set(id, { body: r.body, sender: r.sender });
        }
      }
    } catch (e) {
      console.warn('[chatService.sellerThreadsWithPreview]', e);
    }

    return threads.map((t) => {
      const p = previews.get(t.id);
      return {
        ...t,
        preview: p?.body ?? null,
        previewSender: p?.sender ?? null,
      };
    });
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
