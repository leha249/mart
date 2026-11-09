import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, MessageCircle, Loader2, Store } from 'lucide-react';
import { useCustomer } from '../../context/CustomerContext';
import {
  chatService,
  getStoredToken,
  forgetToken,
  markChatSeen,
  type ChatMessage,
} from '../../services/chat';
import { useToast } from '../../context/ToastContext';
import { errorMessage } from '../../utils/errors';
import { navigate } from '../../utils/navigate';

interface Props {
  open: boolean;
  onClose: () => void;
  sellerId: number | null;
  sellerName?: string;
  /** Если известен слаг — покажем ссылку на магазин. */
  sellerSlug?: string | null;
}

const time = (iso: string) =>
  new Date(iso).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });

const guestInputStyle: React.CSSProperties = {
  width: '100%',
  padding: '11px 14px',
  borderRadius: 12,
  border: '1px solid var(--border)',
  background: 'var(--bg)',
  color: 'var(--text)',
  fontSize: 13,
  outline: 'none',
  fontFamily: 'inherit',
};

const ChatPanel = ({ open, onClose, sellerId, sellerName, sellerSlug }: Props) => {
  const { session, register } = useCustomer();
  const { addToast } = useToast();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  /** Сообщения, которые уже ушли на сервер, но ответ ещё не получен. */
  const [optimistic, setOptimistic] = useState<ChatMessage[]>([]);
  const [thread, setThread] = useState<{ id: number; token: string } | null>(null);
  const [resolvedName, setResolvedName] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guestFirst, setGuestFirst] = useState('');
  const [guestLast, setGuestLast] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [regBusy, setRegBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const title = resolvedName || sellerName || 'Продавец';

  /** Регистрация прямо в чате: имя, фамилия, телефон. */
  const handleGuestRegister = useCallback(async () => {
    if (regBusy) return;
    if (!guestFirst.trim()) {
      setError('Укажите имя');
      return;
    }
    if (!guestLast.trim()) {
      setError('Укажите фамилию');
      return;
    }

    setRegBusy(true);
    setError(null);
    try {
      const res = await register({
        firstName: guestFirst,
        lastName: guestLast,
        phone: guestPhone,
      });
      if (!res.success) {
        setError(res.error || 'Не удалось создать профиль');
        return;
      }
      addToast('Профиль создан — можно писать продавцу', 'success');
    } finally {
      setRegBusy(false);
    }
  }, [addToast, guestFirst, guestLast, guestPhone, regBusy, register]);

  // Открытие треда: сохранённый токен → иначе создаём новый.
  // Если сохранённый тред удалён (магазин удалили) — токен выбрасываем и
  // открываем заново, иначе панель навсегда остаётся с ошибкой.
  useEffect(() => {
    if (!open || !sellerId || !session) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      setOptimistic([]);

      const remember = (list: ChatMessage[], id: number) => {
        const last = list.length ? list[list.length - 1] : null;
        if (last) markChatSeen(id, Number(last.id));
      };

      try {
        const stored = getStoredToken(sellerId);
        let active: { threadId: number; token: string; sellerName?: string | null } | null =
          null;

        if (stored) {
          try {
            const list = await chatService.customerMessages(
              stored.threadId,
              stored.token
            );
            if (cancelled) return;
            setMessages(list);
            remember(list, sellerId);
            active = { threadId: stored.threadId, token: stored.token };
          } catch {
            // Токен больше не действителен — начинаем переписку заново.
            forgetToken(sellerId);
          }
        }

        if (!active) {
          const res = await chatService.openForCustomer(
            sellerId,
            session.phone,
            session.name
          );
          if (cancelled) return;
          const list = await chatService.customerMessages(res.threadId, res.token);
          if (cancelled) return;
          setMessages(list);
          remember(list, sellerId);
          if (res.sellerName) setResolvedName(res.sellerName);
          active = res;
        }

        setThread({ id: active.threadId, token: active.token });
      } catch (e) {
        if (!cancelled) {
          setError(errorMessage(e, 'Не удалось открыть чат'));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, sellerId, session]);

  // Опрос новых сообщений, пока панель открыта
  useEffect(() => {
    if (!open || !thread || !sellerId) return;

    const timer = window.setInterval(async () => {
      try {
        const list = await chatService.customerMessages(
          thread.id,
          thread.token
        );
        setMessages(list);
        const last = list.length ? list[list.length - 1] : null;
        // Панель открыта — значит покупатель прочитал ответ.
        if (last) markChatSeen(sellerId, Number(last.id));
      } catch {
        /* тихо: следующий тик попробует снова */
      }
    }, 4000);

    return () => window.clearInterval(timer);
  }, [open, thread, sellerId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, optimistic.length]);

  // Escape закрывает панель
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const handleSend = useCallback(async () => {
    if (!thread || !sellerId || sending) return;
    const body = text.trim();
    if (!body) return;

    const tempId = -Date.now();
    const optimisticMessage: ChatMessage = {
      id: tempId,
      sender: 'customer',
      body,
      created_at: new Date().toISOString(),
    };

    setOptimistic((prev) => [...prev, optimisticMessage]);
    setText('');
    setSending(true);

    try {
      await chatService.customerSend(thread.id, thread.token, body);
      const list = await chatService.customerMessages(thread.id, thread.token);
      setMessages(list);
      setOptimistic([]);
      const last = list.length ? list[list.length - 1] : null;
      if (last) markChatSeen(sellerId, Number(last.id));
    } catch (e) {
      // Возвращаем текст в поле и убираем «пузырь», чтобы не врать.
      setOptimistic((prev) => prev.filter((m) => m.id !== tempId));
      setText(body);
      addToast(errorMessage(e, 'Не удалось отправить сообщение'), 'error');
    } finally {
      setSending(false);
    }
  }, [thread, sellerId, text, sending, addToast]);

  const visible = [...messages, ...optimistic];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="mora-chat-panel"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.25 }}
          role="dialog"
          aria-label={`Чат с продавцом ${title}`}
          style={{
            position: 'fixed',
            right: 20,
            bottom: 20,
            width: 'min(392px, calc(100vw - 40px))',
            height: 'min(560px, calc(100vh - 40px))',
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <MessageCircle
                size={16}
                style={{ color: 'var(--accent)', flexShrink: 0 }}
              />
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {title}
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                  Обычно отвечает в течение дня
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {sellerSlug && (
                <button
                  onClick={() => {
                    onClose();
                    navigate(`/seller/${sellerSlug}`);
                  }}
                  aria-label="Открыть магазин"
                  title="Открыть магазин"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--muted)',
                    cursor: 'pointer',
                    padding: 6,
                    display: 'flex',
                  }}
                >
                  <Store size={15} />
                </button>
              )}
              <button
                onClick={onClose}
                aria-label="Закрыть чат"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--muted)',
                  cursor: 'pointer',
                  padding: 6,
                  display: 'flex',
                }}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Без сессии — быстрая регистрация прямо в чате */}
          {!session && (
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                gap: 10,
                padding: 20,
              }}
            >
              <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>
                Представьтесь — продавец поймёт, кому отвечает. Профиль
                создаётся один раз и работает для заказов и чатов.
              </div>
              <input
                value={guestFirst}
                onChange={(e) => setGuestFirst(e.target.value)}
                placeholder="Имя"
                maxLength={60}
                disabled={regBusy}
                style={guestInputStyle}
              />
              <input
                value={guestLast}
                onChange={(e) => setGuestLast(e.target.value)}
                placeholder="Фамилия"
                maxLength={60}
                disabled={regBusy}
                style={guestInputStyle}
              />
              <input
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                placeholder="+7 900 000-00-00"
                type="tel"
                inputMode="tel"
                maxLength={20}
                disabled={regBusy}
                style={guestInputStyle}
              />
              {error && (
                <div style={{ color: 'var(--danger)', fontSize: 12 }}>{error}</div>
              )}
              <button
                onClick={handleGuestRegister}
                disabled={regBusy}
                style={{
                  padding: '11px 20px',
                  borderRadius: 100,
                  border: 'none',
                  background: 'var(--accent)',
                  color: 'var(--accent-contrast)',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: regBusy ? 'wait' : 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {regBusy ? 'Создаём профиль…' : 'Начать чат'}
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
                  overscrollBehavior: 'contain',
                }}
              >
                {loading && (
                  <div
                    style={{
                      color: 'var(--muted)',
                      fontSize: 12,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                    Открываем чат…
                  </div>
                )}

                {error && (
                  <div
                    style={{
                      color: 'var(--danger)',
                      fontSize: 12.5,
                      lineHeight: 1.5,
                    }}
                  >
                    {error}
                  </div>
                )}

                {!loading && !error && visible.length === 0 && (
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

                {visible.map((m) => {
                  const mine = m.sender === 'customer';
                  const pending = m.id < 0;
                  return (
                    <div
                      key={m.id}
                      style={{
                        alignSelf: mine ? 'flex-end' : 'flex-start',
                        maxWidth: '82%',
                        padding: '9px 13px',
                        borderRadius: 14,
                        background: mine ? 'var(--accent)' : 'var(--surface-hi)',
                        color: mine ? 'var(--accent-contrast)' : 'var(--text)',
                        fontSize: 13,
                        lineHeight: 1.45,
                        whiteSpace: 'pre-wrap',
                        opacity: pending ? 0.6 : 1,
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
                        {pending ? 'отправляется…' : time(m.created_at)}
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
                  aria-label="Сообщение продавцу"
                  style={{
                    flex: 1,
                    minWidth: 0,
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
                    flexShrink: 0,
                    borderRadius: 12,
                    border: 'none',
                    background: text.trim() ? 'var(--accent)' : 'var(--surface-hi)',
                    color: text.trim() ? 'var(--accent-contrast)' : 'var(--muted)',
                    cursor: text.trim() && !sending ? 'pointer' : 'not-allowed',
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

          <style>{`
            @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            /* На телефоне чат занимает экран: иначе поле ввода уезжает под клавиатуру */
            @media (max-width: 560px) {
              .mora-chat-panel {
                right: 0 !important;
                bottom: 0 !important;
                left: 0 !important;
                width: 100vw !important;
                height: 100dvh !important;
                max-height: 100dvh !important;
                border-radius: 0 !important;
                border-left: none !important;
                border-right: none !important;
                border-bottom: none !important;
              }
            }
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ChatPanel;
