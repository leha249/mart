import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Loader2, RefreshCw, ChevronRight } from 'lucide-react';
import { chatService, type CustomerChat } from '../../services/chat';
import { errorMessage } from '../../utils/errors';
import { navigate } from '../../utils/navigate';

interface Props {
  /** Открыть панель чата с конкретным продавцом. */
  onOpen: (chat: CustomerChat) => void;
}

/** «сегодня 14:20», «вчера», «12 сент.» — компактно и по-русски. */
const when = (iso: string | null): string => {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';

  const now = new Date();
  const startOfDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round(
    (startOfDay(now) - startOfDay(date)) / (24 * 60 * 60 * 1000)
  );

  if (diffDays === 0) {
    return date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  if (diffDays === 1) return 'вчера';
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
};

const CustomerChats = ({ onOpen }: Props) => {
  const [chats, setChats] = useState<CustomerChat[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const list = await chatService.listCustomerChats();
      setChats(list);
      setError(null);
    } catch (e) {
      setError(errorMessage(e, 'Не удалось загрузить чаты'));
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const list = await chatService.listCustomerChats();
        if (!alive) return;
        setChats(list);
        setError(null);
      } catch (e) {
        if (!alive) return;
        setError(errorMessage(e, 'Не удалось загрузить чаты'));
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  // Вернулись на вкладку из другого места — обновим непрочитанные.
  useEffect(() => {
    const onFocus = () => {
      chatService
        .listCustomerChats()
        .then(setChats)
        .catch(() => {
          /* тихо: обновимся в следующий раз */
        });
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  const unseenTotal = chats.filter((c) => c.unseen).length;

  return (
    <section
      id="chats"
      style={{
        marginTop: 32,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 20,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          padding: '18px 20px',
          borderBottom: chats.length ? '1px solid var(--border)' : 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <MessageCircle size={17} style={{ color: 'var(--accent)', flexShrink: 0 }} />
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>
              Чаты с продавцами
              {unseenTotal > 0 && (
                <span
                  style={{
                    marginLeft: 8,
                    fontSize: 11,
                    padding: '2px 8px',
                    borderRadius: 100,
                    background: 'var(--accent)',
                    color: 'var(--accent-contrast)',
                    fontWeight: 800,
                    verticalAlign: 'middle',
                  }}
                >
                  {unseenTotal} новых
                </span>
              )}
            </h2>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
              Переписка хранится на этом устройстве
            </div>
          </div>
        </div>

        <button
          onClick={() => load()}
          disabled={refreshing}
          aria-label="Обновить чаты"
          title="Обновить"
          style={{
            background: 'none',
            border: '1px solid var(--border)',
            borderRadius: 10,
            color: 'var(--muted)',
            cursor: refreshing ? 'wait' : 'pointer',
            padding: 8,
            display: 'flex',
            flexShrink: 0,
          }}
        >
          <RefreshCw
            size={14}
            style={refreshing ? { animation: 'spin 1s linear infinite' } : undefined}
          />
        </button>
      </div>

      {loading && (
        <div
          style={{
            padding: 28,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            color: 'var(--muted)',
            fontSize: 13,
          }}
        >
          <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
          Загружаем переписку…
        </div>
      )}

      {!loading && error && (
        <div style={{ padding: '20px 20px 24px', color: 'var(--danger)', fontSize: 13 }}>
          {error}
        </div>
      )}

      {!loading && !error && chats.length === 0 && (
        <div style={{ padding: '24px 20px 28px' }}>
          <div
            style={{
              fontSize: 13.5,
              color: 'var(--muted)',
              lineHeight: 1.6,
              maxWidth: 520,
            }}
          >
            Пока переписки нет. Напишите продавцу со страницы магазина или
            товара — здесь появится вся история переписки, и вы сможете
            продолжить её в любой момент.
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/sellers')}
              style={{
                padding: '10px 18px',
                borderRadius: 100,
                border: 'none',
                background: 'var(--accent)',
                color: 'var(--accent-contrast)',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              К магазинам
            </button>
            <button
              onClick={() => navigate('/catalog')}
              style={{
                padding: '10px 18px',
                borderRadius: 100,
                border: '1px solid var(--border)',
                background: 'transparent',
                color: 'var(--text)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              В каталог
            </button>
          </div>
        </div>
      )}

      {!loading &&
        !error &&
        chats.map((chat, i) => (
          <motion.button
            key={chat.sellerId}
            onClick={() => onOpen(chat)}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: Math.min(i * 0.04, 0.2) }}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '14px 20px',
              border: 'none',
              borderTop: i === 0 ? 'none' : '1px solid var(--border)',
              background: chat.unseen ? 'rgba(232,255,90,0.04)' : 'transparent',
              cursor: 'pointer',
              fontFamily: 'inherit',
              textAlign: 'left',
            }}
          >
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                flexShrink: 0,
                background: 'var(--surface-hi)',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
                fontWeight: 800,
                color: 'var(--accent)',
              }}
            >
              {chat.sellerName.charAt(0).toUpperCase()}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 2,
                }}
              >
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {chat.sellerName}
                </span>
                {chat.unseen && (
                  <span
                    style={{
                      fontSize: 10,
                      padding: '2px 7px',
                      borderRadius: 100,
                      background: 'var(--accent)',
                      color: 'var(--accent-contrast)',
                      fontWeight: 800,
                      flexShrink: 0,
                    }}
                  >
                    ответил
                  </span>
                )}
              </div>
              <div
                style={{
                  fontSize: 12.5,
                  color: 'var(--muted)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {chat.lastMessage
                  ? `${chat.lastSender === 'seller' ? '' : 'Вы: '}${chat.lastMessage}`
                  : 'Переписка ещё не начата'}
              </div>
            </div>

            <div
              style={{
                fontSize: 11,
                color: 'var(--muted)',
                flexShrink: 0,
                whiteSpace: 'nowrap',
              }}
            >
              {when(chat.lastAt)}
            </div>
            <ChevronRight size={16} style={{ color: 'var(--muted)', flexShrink: 0 }} />
          </motion.button>
        ))}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </section>
  );
};

export default CustomerChats;
