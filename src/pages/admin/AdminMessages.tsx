import { useCallback, useEffect, useRef, useState } from 'react';
import { MessageCircle, Send, Loader2, Phone } from 'lucide-react';
import { chatService, type ChatThread, type ChatMessage } from '../../services/chat';
import { useToast } from '../../context/ToastContext';

const time = (iso: string) =>
  new Date(iso).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

const AdminMessages = () => {
  const { addToast } = useToast();
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [active, setActive] = useState<ChatThread | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadThreads = useCallback(async () => {
    try {
      const list = await chatService.sellerThreads();
      setThreads(list);
      setActive((prev) => {
        if (prev) return list.find((t) => t.id === prev.id) ?? null;
        return list[0] ?? null;
      });
    } catch {
      addToast('Не удалось загрузить чаты', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  // Сообщения выбранного треда + опрос
  useEffect(() => {
    if (!active) {
      setMessages([]);
      return;
    }
    let cancelled = false;

    const load = async () => {
      try {
        const list = await chatService.sellerMessages(active.id);
        if (!cancelled) setMessages(list);
      } catch {
        /* следующий тик */
      }
    };

    load();
    const timer = window.setInterval(load, 5000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [active]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = async () => {
    if (!active || sending) return;
    const body = text.trim();
    if (!body) return;
    setSending(true);
    try {
      await chatService.sellerSend(active.id, body);
      setText('');
      setMessages(await chatService.sellerMessages(active.id));
      loadThreads();
    } catch {
      addToast('Не удалось отправить', 'error');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 40, color: 'var(--muted)', fontSize: 13 }}>
        <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />{' '}
        Загрузка чатов…
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 320px) minmax(0, 1fr)',
        gap: 16,
        minHeight: 520,
      }}
      className="messages-grid"
    >
      {/* Список тредов */}
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 18,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '14px 16px',
            borderBottom: '1px solid var(--border)',
            fontSize: 12,
            letterSpacing: 1.2,
            textTransform: 'uppercase',
            color: 'var(--muted)',
          }}
        >
          Диалоги ({threads.length})
        </div>

        {threads.length === 0 ? (
          <div
            style={{
              padding: 24,
              fontSize: 13,
              color: 'var(--muted)',
              display: 'flex',
              gap: 8,
              alignItems: 'center',
            }}
          >
            <MessageCircle size={15} /> Пока никто не писал
          </div>
        ) : (
          <div style={{ maxHeight: 560, overflowY: 'auto' }}>
            {threads.map((t) => {
              const isActive = active?.id === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActive(t)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '12px 16px',
                    border: 'none',
                    borderBottom: '1px solid var(--border)',
                    background: isActive ? 'var(--surface-hi)' : 'transparent',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    display: 'block',
                  }}
                >
                  <div style={{ fontSize: 13, color: 'var(--text)' }}>
                    {t.customer_name || t.customer_phone}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                    {time(t.last_message_at)}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Переписка */}
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 18,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {!active ? (
          <div
            style={{
              margin: 'auto',
              color: 'var(--muted)',
              fontSize: 13,
              display: 'flex',
              gap: 8,
              alignItems: 'center',
            }}
          >
            <MessageCircle size={16} /> Выберите диалог
          </div>
        ) : (
          <>
            <div
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10,
                flexWrap: 'wrap',
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 600 }}>
                {active.customer_name || 'Покупатель'}
              </div>
              <a
                href={`tel:${active.customer_phone}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 12,
                  color: 'var(--muted)',
                  textDecoration: 'none',
                }}
              >
                <Phone size={13} /> {active.customer_phone}
              </a>
            </div>

            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                maxHeight: 460,
              }}
            >
              {messages.length === 0 && (
                <div style={{ color: 'var(--muted)', fontSize: 12.5 }}>
                  Сообщений нет
                </div>
              )}
              {messages.map((m) => {
                const mine = m.sender === 'seller';
                return (
                  <div
                    key={m.id}
                    style={{
                      alignSelf: mine ? 'flex-end' : 'flex-start',
                      maxWidth: '78%',
                      padding: '9px 13px',
                      borderRadius: 14,
                      background: mine ? 'var(--accent)' : 'var(--surface-hi)',
                      color: mine ? 'var(--accent-contrast)' : 'var(--text)',
                      fontSize: 13,
                      lineHeight: 1.45,
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {m.body}
                    <div
                      style={{
                        fontSize: 10,
                        opacity: 0.6,
                        marginTop: 3,
                        textAlign: 'right',
                      }}
                    >
                      {time(m.created_at)}
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            <div
              style={{
                display: 'flex',
                gap: 8,
                padding: 12,
                borderTop: '1px solid var(--border)',
              }}
            >
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ответить покупателю…"
                maxLength={2000}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: 12,
                  border: '1px solid var(--border)',
                  background: 'var(--bg)',
                  color: 'var(--text)',
                  fontSize: 13,
                  outline: 'none',
                  fontFamily: 'inherit',
                }}
              />
              <button
                onClick={handleSend}
                disabled={sending || !text.trim()}
                aria-label="Отправить сообщение"
                style={{
                  width: 42,
                  borderRadius: 12,
                  border: 'none',
                  background: text.trim() ? 'var(--accent)' : 'var(--surface-hi)',
                  color: text.trim() ? 'var(--accent-contrast)' : 'var(--muted)',
                  cursor: text.trim() ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Send size={16} />
              </button>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @media (max-width: 860px) {
          .messages-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};

export default AdminMessages;
