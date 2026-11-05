import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, MessageCircle, Loader2 } from 'lucide-react';
import { useCustomer } from '../../context/CustomerContext';
import { chatService, getStoredToken, type ChatMessage } from '../../services/chat';
import { navigate } from '../../utils/navigate';
import { useToast } from '../../context/ToastContext';

interface Props {
  open: boolean;
  onClose: () => void;
  sellerId: number | null;
  sellerName?: string;
}

const time = (iso: string) =>
  new Date(iso).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });

const ChatPanel = ({ open, onClose, sellerId, sellerName }: Props) => {
  const { session } = useCustomer();
  const { addToast } = useToast();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [thread, setThread] = useState<{ id: number; token: string } | null>(null);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Открытие треда
  useEffect(() => {
    if (!open || !sellerId || !session) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const stored = getStoredToken(sellerId);
        const res = stored
          ? { threadId: stored.threadId, token: stored.token }
          : await chatService.openForCustomer(
              sellerId,
              session.phone,
              session.name
            );
        if (cancelled) return;
        setThread({ id: res.threadId, token: res.token });
        const list = await chatService.customerMessages(
          res.threadId,
          res.token
        );
        if (!cancelled) setMessages(list);
      } catch {
        if (!cancelled) setError('Не удалось открыть чат');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, sellerId, session]);

  // Опрос новых сообщений
  useEffect(() => {
    if (!open || !thread) return;
    const timer = window.setInterval(async () => {
      try {
        const list = await chatService.customerMessages(
          thread.id,
          thread.token
        );
        setMessages(list);
      } catch {
        /* тихо: следующий тик попробует снова */
      }
    }, 4000);
    return () => window.clearInterval(timer);
  }, [open, thread]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = useCallback(async () => {
    if (!thread || sending) return;
    const body = text.trim();
    if (!body) return;

    setSending(true);
    try {
      await chatService.customerSend(thread.id, thread.token, body);
      setText('');
      const list = await chatService.customerMessages(thread.id, thread.token);
      setMessages(list);
    } catch {
      addToast('Не удалось отправить сообщение', 'error');
    } finally {
      setSending(false);
    }
  }, [thread, text, sending, addToast]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.25 }}
          style={{
            position: 'fixed',
            right: 20,
            bottom: 20,
            width: 'min(380px, calc(100vw - 40px))',
            height: 'min(520px, calc(100vh - 40px))',
            zIndex: 900,
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--surface)',
            border: '1px solid var(--border-hi)',
            borderRadius: 18,
            overflow: 'hidden',
            boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
          }}
        >
          {/* Заголовок */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
              padding: '14px 16px',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <MessageCircle size={16} style={{ color: 'var(--accent)' }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>
                  {sellerName ?? 'Продавец'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                  Обычно отвечает в течение дня
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Закрыть чат"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--muted)',
                cursor: 'pointer',
                padding: 4,
              }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Без сессии */}
          {!session && (
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 14,
                padding: 24,
                textAlign: 'center',
              }}
            >
              <MessageCircle size={28} style={{ color: 'var(--muted)' }} />
              <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>
                Чтобы написать продавцу, войдите по номеру телефона — так он
                поймёт, кому отвечает.
              </div>
              <button
                onClick={() => {
                  onClose();
                  navigate('/login-customer');
                }}
                style={{
                  padding: '11px 20px',
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
                Войти по телефону
              </button>
            </div>
          )}

          {/* Сообщения */}
          {session && (
            <>
              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                {loading && (
                  <div style={{ color: 'var(--muted)', fontSize: 12 }}>
                    <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />{' '}
                    Открываем чат…
                  </div>
                )}

                {error && (
                  <div style={{ color: 'var(--danger)', fontSize: 12 }}>
                    {error}
                  </div>
                )}

                {!loading && !error && messages.length === 0 && (
                  <div
                    style={{
                      color: 'var(--muted)',
                      fontSize: 12.5,
                      lineHeight: 1.6,
                    }}
                  >
                    Напишите продавцу: спросите про размер, наличие, доставку или
                    оплату.
                  </div>
                )}

                {messages.map((m) => {
                  const mine = m.sender === 'customer';
                  return (
                    <div
                      key={m.id}
                      style={{
                        alignSelf: mine ? 'flex-end' : 'flex-start',
                        maxWidth: '82%',
                        padding: '9px 13px',
                        borderRadius: 14,
                        background: mine
                          ? 'var(--accent)'
                          : 'var(--surface-hi)',
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
                  placeholder="Сообщение…"
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
                  aria-label="Отправить"
                  style={{
                    width: 40,
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

          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ChatPanel;
