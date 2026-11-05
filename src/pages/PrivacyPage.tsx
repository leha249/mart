import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Cursor from '../components/Cursor';
import ScrollProgress from '../components/ScrollProgress';
import { navigate } from '../utils/navigate';
import { usePageMeta } from '../hooks/usePageMeta';

const PrivacyPage = () => {
  usePageMeta({ title: 'Политика конфиденциальности — MØRA MART' });

  const goHome = () => {
    navigate('/');
  };

  const goToDataRequest = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate('/data-request');
  };

  return (
    <div style={{ minHeight: '100vh' }}>
      <ScrollProgress />
      <Cursor />
      <Navbar />

      <main style={{ paddingTop: 120, paddingBottom: 100 }}>
        <div className="container" style={{ maxWidth: 800 }}>
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
              • Документы
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
              Политика{' '}
              <span style={{ fontStyle: 'italic', color: 'var(--accent)' }}>
                конфиденциальности
              </span>
            </h1>
            <p
              style={{
                fontSize: 14,
                color: 'var(--muted)',
                marginBottom: 40,
              }}
            >
              Редакция от 17 октября 2026 г.
            </p>

            <div
              style={{
                fontSize: 16,
                lineHeight: 1.8,
                color: 'var(--text-dim)',
                display: 'flex',
                flexDirection: 'column',
                gap: 24,
              }}
            >
              <p>
                Настоящая Политика описывает, как платформа{' '}
                <strong style={{ color: 'var(--text)' }}>MØRA MART</strong>{' '}
                обрабатывает персональные данные пользователей в соответствии с
                Федеральным законом № 152-ФЗ «О персональных данных».
              </p>

              <h2
                className="serif"
                style={{ fontSize: 24, fontWeight: 900, marginTop: 16 }}
              >
                1. Оператор персональных данных
              </h2>
              <div
                style={{
                  padding: 20,
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  fontSize: 14,
                  color: 'var(--muted)',
                  lineHeight: 1.8,
                }}
              >
                <div style={{ marginBottom: 8 }}>
                  <strong style={{ color: 'var(--text)' }}>ФИО:</strong>{' '}
                  [УКАЖИТЕ ФИО ОПЕРАТОРА]
                </div>
                <div style={{ marginBottom: 8 }}>
                  <strong style={{ color: 'var(--text)' }}>Статус:</strong>{' '}
                  самозанятый (плательщик налога на профессиональный доход)
                </div>
                <div style={{ marginBottom: 8 }}>
                  <strong style={{ color: 'var(--text)' }}>ИНН:</strong>{' '}
                  [УКАЖИТЕ ИНН]
                </div>
                <div style={{ marginBottom: 8 }}>
                  <strong style={{ color: 'var(--text)' }}>Адрес:</strong>{' '}
                  [УКАЖИТЕ АДРЕС ДЛЯ ОБРАЩЕНИЙ]
                </div>
                <div style={{ marginBottom: 8 }}>
                  <strong style={{ color: 'var(--text)' }}>Email:</strong>{' '}
                  privacy@moramart.ru
                </div>
                <div>
                  <strong style={{ color: 'var(--text)' }}>Телефон:</strong>{' '}
                  [УКАЖИТЕ ТЕЛЕФОН]
                </div>
              </div>

              <h2
                className="serif"
                style={{ fontSize: 24, fontWeight: 900, marginTop: 16 }}
              >
                2. Какие данные мы собираем
              </h2>
              <ul
                style={{
                  paddingLeft: 24,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <li>
                  <strong style={{ color: 'var(--text)' }}>
                    При оформлении заказа:
                  </strong>{' '}
                  имя, телефон, email (по желанию)
                </li>
                <li>
                  <strong style={{ color: 'var(--text)' }}>
                    При регистрации продавца:
                  </strong>{' '}
                  ФИО, телефон, email
                </li>
                <li>
                  <strong style={{ color: 'var(--text)' }}>
                    Автоматически:
                  </strong>{' '}
                  IP-адрес, тип браузера, время посещения
                </li>
                <li>
                  <strong style={{ color: 'var(--text)' }}>
                    Локально (localStorage):
                  </strong>{' '}
                  корзина, избранное, история поиска, тема
                </li>
              </ul>

              <h2
                className="serif"
                style={{ fontSize: 24, fontWeight: 900, marginTop: 16 }}
              >
                3. Цели обработки
              </h2>
              <ul
                style={{
                  paddingLeft: 24,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <li>Обработка и исполнение заказов</li>
                <li>Связь с покупателем по вопросам заказа</li>
                <li>Модерация продавцов и управление платформой</li>
                <li>Улучшение работы платформы</li>
                <li>Соблюдение требований законодательства</li>
              </ul>

              <h2
                className="serif"
                style={{ fontSize: 24, fontWeight: 900, marginTop: 16 }}
              >
                4. Передача данных третьим лицам
              </h2>
              <p>
                При оформлении заказа данные покупателя (имя, телефон, email){' '}
                <strong style={{ color: 'var(--text)' }}>
                  передаются продавцу
                </strong>
                , чьи товары заказаны, для исполнения заказа. Продавец обязуется
                использовать эти данные исключительно для исполнения заказа и не
                передавать третьим лицам.
              </p>

              <h2
                className="serif"
                style={{ fontSize: 24, fontWeight: 900, marginTop: 16 }}
              >
                5. Трансграничная передача
              </h2>
              <div
                style={{
                  padding: 20,
                  background: 'rgba(255,77,77,0.06)',
                  border: '1px solid rgba(255,77,77,0.25)',
                  borderRadius: 12,
                  fontSize: 14,
                  lineHeight: 1.7,
                  color: 'var(--text-dim)',
                }}
              >
                Персональные данные хранятся на серверах{' '}
                <strong style={{ color: 'var(--text)' }}>Supabase</strong>{' '}
                (Amazon Web Services, США/ЕС). Пользуясь сайтом и оформляя заказ,
                вы даёте согласие на трансграничную передачу ваших данных в
                соответствии со ст. 12 152-ФЗ.
              </div>

              <h2
                className="serif"
                style={{ fontSize: 24, fontWeight: 900, marginTop: 16 }}
              >
                6. Срок хранения
              </h2>
              <p>
                Данные хранятся до достижения целей обработки или до отзыва
                согласия. Заказы хранятся в течение 3 лет в соответствии с
                требованиями бухгалтерского учёта. Коды подтверждения — 10
                минут, после чего удаляются автоматически.
              </p>

              <h2
                className="serif"
                style={{ fontSize: 24, fontWeight: 900, marginTop: 16 }}
              >
                7. Ваши права и отзыв согласия
              </h2>
              <ul
                style={{
                  paddingLeft: 24,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <li>Запросить доступ к вашим данным</li>
                <li>Требовать исправления неточных данных</li>
                <li>Отозвать согласие на обработку</li>
                <li>Требовать удаления данных</li>
              </ul>
              <p>
                Для реализации прав напишите на{' '}
                <a
                  href="mailto:privacy@moramart.ru"
                  style={{
                    color: 'var(--accent)',
                    textDecoration: 'none',
                    fontWeight: 600,
                  }}
                >
                  privacy@moramart.ru
                </a>{' '}
                или заполните{' '}
                <a
                  href="/data-request"
                  onClick={goToDataRequest}
                  style={{
                    color: 'var(--accent)',
                    textDecoration: 'underline',
                    fontWeight: 600,
                  }}
                >
                  форму запроса
                </a>
                . Мы ответим в течение 10 рабочих дней.
              </p>

              <h2
                className="serif"
                style={{ fontSize: 24, fontWeight: 900, marginTop: 16 }}
              >
                8. Cookies и localStorage
              </h2>
              <p>
                Платформа использует cookies и localStorage для работы корзины,
                избранного, темы и истории поиска. Эти данные хранятся локально в
                вашем браузере и не передаются на сервер без вашего действия
                (например, при оформлении заказа).
              </p>

              <h2
                className="serif"
                style={{ fontSize: 24, fontWeight: 900, marginTop: 16 }}
              >
                9. Защита данных
              </h2>
              <p>
                Мы используем HTTPS, шифрование и защищённое хранилище Supabase.
                Доступ к персональным данным имеют только уполномоченные
                сотрудники и продавцы (в части своих заказов).
              </p>

              {/* ✅ НОВЫЙ РАЗДЕЛ: ДЕЙСТВИЯ ПРИ УТЕЧКЕ */}
              <h2
                className="serif"
                style={{ fontSize: 24, fontWeight: 900, marginTop: 16 }}
              >
                10. Действия при утечке персональных данных
              </h2>
              <div
                style={{
                  padding: 20,
                  background: 'rgba(255,77,77,0.06)',
                  border: '1px solid rgba(255,77,77,0.25)',
                  borderRadius: 12,
                  fontSize: 14,
                  lineHeight: 1.7,
                  color: 'var(--text-dim)',
                }}
              >
                В случае неправомерной или случайной передачи (утечки)
                персональных данных Оператор обязуется:
                <ul style={{ margin: '12px 0 0', paddingLeft: 24 }}>
                  <li>
                    <strong style={{ color: 'var(--text)' }}>
                      в течение 24 часов
                    </strong>{' '}
                    уведомить Роскомнадзор о факте утечки;
                  </li>
                  <li>
                    <strong style={{ color: 'var(--text)' }}>
                      в течение 72 часов
                    </strong>{' '}
                    провести внутреннее расследование и уведомить РКН о его
                    результатах;
                  </li>
                  <li>
                    <strong style={{ color: 'var(--text)' }}>
                      в течение 24 часов
                    </strong>{' '}
                    с момента выявления инцидента уведомить субъектов ПД, чьи
                    данные были затронуты;
                  </li>
                  <li>
                    принять меры по устранению последствий и предотвращению
                    повторных инцидентов.
                  </li>
                </ul>
              </div>

              <h2
                className="serif"
                style={{ fontSize: 24, fontWeight: 900, marginTop: 16 }}
              >
                11. Изменения
              </h2>
              <p>
                Актуальная версия политики всегда доступна на этой странице.
              </p>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PrivacyPage;
