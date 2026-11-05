import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Check,
  Send,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Cursor from '../components/Cursor';
import ScrollProgress from '../components/ScrollProgress';
import { useToast } from '../context/ToastContext';
import { supabase } from '../lib/supabase';
import { navigate } from '../utils/navigate';
import { usePageMeta } from '../hooks/usePageMeta';

const DataRequestPage = () => {
  const { addToast } = useToast();

  const [contact, setContact] = useState('');
  const [requestType, setRequestType] = useState<
    'delete' | 'access' | 'revoke'
  >('delete');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  usePageMeta({ title: 'Запрос данных — MØRA MART' });

  const goHome = () => {
    navigate('/');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || sent) return;

    const trimmed = contact.trim();
    if (!trimmed) {
      setError('Укажите email или телефон');
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      // 1. Сначала фиксируем заявку в базе: если человек закроет почтовый
      //    клиент — обращение всё равно не потеряется и попадёт в срок.
      const { error: dbError } = await supabase.from('data_requests').insert({
        contact: trimmed.slice(0, 200),
        request_type:
          requestType === 'revoke' ? 'revoke_consent' : requestType,
        comment: comment.trim() ? comment.trim().slice(0, 2000) : null,
      });

      if (dbError) throw dbError;

      // 2. И только потом открываем почту с готовым письмом
      const subject = encodeURIComponent(
        `Запрос данных — ${requestType === 'delete' ? 'удаление' : requestType === 'access' ? 'доступ' : 'отзыв согласия'}`
      );
      const body = encodeURIComponent(
        `Контакт для связи: ${trimmed}\n\nТип запроса: ${
          requestType === 'delete'
            ? 'Удаление всех данных'
            : requestType === 'access'
            ? 'Получение копии данных'
            : 'Отзыв согласия на обработку'
        }\n\n${comment ? `Комментарий:\n${comment}\n\n` : ''}Заявка зарегистрирована на сайте MØRA MART.`
      );

      window.location.href = `mailto:privacy@moramart.ru?subject=${subject}&body=${body}`;

      setSent(true);
      addToast(
        'Запрос сформирован — отправьте письмо из вашего почтового клиента',
        'success'
      );

      setTimeout(() => {
        setContact('');
        setComment('');
        setSent(false);
      }, 5000);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Ошибка отправки';
      setError(msg);
      addToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh' }}>
      <ScrollProgress />
      <Cursor />
      <Navbar />

      <main style={{ paddingTop: 120, paddingBottom: 100 }}>
        <div className="container" style={{ maxWidth: 640 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <button
              onClick={goHome}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--muted)',
                cursor: 'pointer',
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontFamily: 'inherit',
                padding: 0,
                marginBottom: 32,
              }}
            >
              <ArrowLeft size={14} /> На главную
            </button>

            <div
              style={{
                fontSize: 12,
                letterSpacing: '2px',
                textTransform: 'uppercase',
                color: 'var(--muted)',
                marginBottom: 16,
              }}
            >
              • Ваши данные
            </div>
            <h1
              className="serif"
              style={{
                fontSize: 'clamp(32px, 5vw, 56px)',
                fontWeight: 900,
                letterSpacing: '-1.5px',
                lineHeight: 1,
                marginBottom: 16,
              }}
            >
              Управление{' '}
              <span style={{ fontStyle: 'italic', color: 'var(--accent)' }}>
                данными
              </span>
            </h1>
            <p
              style={{
                fontSize: 15,
                color: 'var(--muted)',
                lineHeight: 1.65,
                marginBottom: 32,
              }}
            >
              По 152-ФЗ вы можете запросить доступ к своим данным, отозвать
              согласие на обработку или потребовать удаления. Заполните форму —
              мы ответим в течение 10 рабочих дней.
            </p>

            {sent ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                  padding: 32,
                  background: 'rgba(74,222,128,0.08)',
                  border: '1px solid rgba(74,222,128,0.3)',
                  borderRadius: 16,
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    background: 'var(--success)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                    color: '#000',
                  }}
                >
                  <Check size={32} strokeWidth={3} />
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
                  Запрос сформирован
                </div>
                <div
                  style={{
                    fontSize: 14,
                    color: 'var(--muted)',
                    lineHeight: 1.6,
                  }}
                >
                  Если почтовый клиент не открылся — напишите напрямую на{' '}
                  <a
                    href="mailto:privacy@moramart.ru"
                    style={{
                      color: 'var(--accent)',
                      textDecoration: 'underline',
                    }}
                  >
                    privacy@moramart.ru
                  </a>
                  .
                </div>
              </motion.div>
            ) : (
              <form
                onSubmit={handleSubmit}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 20,
                  padding: 32,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 20,
                }}
              >
                <div>
                  <label
                    style={{
                      fontSize: 12,
                      color: 'var(--muted)',
                      letterSpacing: '1px',
                      textTransform: 'uppercase',
                      display: 'block',
                      marginBottom: 10,
                    }}
                  >
                    Тип запроса *
                  </label>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                    }}
                  >
                    {[
                      {
                        value: 'delete' as const,
                        label: 'Удалить все мои данные',
                      },
                      {
                        value: 'access' as const,
                        label: 'Получить копию моих данных',
                      },
                      {
                        value: 'revoke' as const,
                        label: 'Отозвать согласие на обработку',
                      },
                    ].map((opt) => (
                      <label
                        key={opt.value}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          padding: '12px 16px',
                          background:
                            requestType === opt.value
                              ? 'rgba(232,255,90,0.08)'
                              : 'var(--bg)',
                          border:
                            requestType === opt.value
                              ? '1px solid var(--accent)'
                              : '1px solid var(--border)',
                          borderRadius: 12,
                          cursor: 'pointer',
                          fontSize: 14,
                          transition: 'all 0.2s',
                        }}
                      >
                        <input
                          type="radio"
                          name="requestType"
                          value={opt.value}
                          checked={requestType === opt.value}
                          onChange={() => setRequestType(opt.value)}
                          disabled={submitting}
                          style={{
                            accentColor: 'var(--accent)',
                            cursor: submitting ? 'not-allowed' : 'pointer',
                          }}
                        />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label
                    style={{
                      fontSize: 12,
                      color: 'var(--muted)',
                      letterSpacing: '1px',
                      textTransform: 'uppercase',
                      display: 'block',
                      marginBottom: 8,
                    }}
                  >
                    Email или телефон, который вы указывали *
                  </label>
                  <input
                    type="text"
                    value={contact}
                    onChange={(e) => {
                      setContact(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="you@example.com или +7 900 000-00-00"
                    disabled={submitting}
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      background: 'var(--bg)',
                      border: error
                        ? '1px solid var(--danger)'
                        : '1px solid var(--border)',
                      borderRadius: 12,
                      color: 'var(--text)',
                      fontSize: 14,
                      outline: 'none',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      fontSize: 12,
                      color: 'var(--muted)',
                      letterSpacing: '1px',
                      textTransform: 'uppercase',
                      display: 'block',
                      marginBottom: 8,
                    }}
                  >
                    Комментарий (необязательно)
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Дополнительная информация"
                    rows={3}
                    disabled={submitting}
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      background: 'var(--bg)',
                      border: '1px solid var(--border)',
                      borderRadius: 12,
                      color: 'var(--text)',
                      fontSize: 14,
                      outline: 'none',
                      fontFamily: 'inherit',
                      resize: 'vertical',
                      minHeight: 80,
                    }}
                  />
                </div>

                {error && (
                  <div
                    style={{
                      padding: '10px 14px',
                      background: 'rgba(255,77,77,0.1)',
                      border: '1px solid rgba(255,77,77,0.3)',
                      borderRadius: 10,
                      color: 'var(--danger)',
                      fontSize: 13,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <AlertCircle size={14} /> {error}
                  </div>
                )}

                <motion.button
                  type="submit"
                  whileHover={{ scale: submitting ? 1 : 1.02 }}
                  whileTap={{ scale: submitting ? 1 : 0.98 }}
                  disabled={submitting || !contact.trim()}
                  style={{
                    padding: '16px',
                    borderRadius: 100,
                    border: 'none',
                    background: 'var(--accent)',
                    color: '#000',
                    fontSize: 15,
                    fontWeight: 700,
                    cursor:
                      submitting || !contact.trim() ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                    opacity: submitting || !contact.trim() ? 0.5 : 1,
                  }}
                >
                  {submitting ? (
                    <>
                      <Loader2
                        size={16}
                        style={{ animation: 'spin 1s linear infinite' }}
                      />
                      Отправка...
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      Сформировать запрос
                    </>
                  )}
                </motion.button>

                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--muted)',
                    textAlign: 'center',
                    lineHeight: 1.6,
                  }}
                >
                  Или напишите напрямую:{' '}
                  <a
                    href="mailto:privacy@moramart.ru"
                    style={{
                      color: 'var(--accent)',
                      textDecoration: 'underline',
                    }}
                  >
                    privacy@moramart.ru
                  </a>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      </main>

      <Footer />

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default DataRequestPage;
