import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Cursor from '../components/Cursor';
import ScrollProgress from '../components/ScrollProgress';
import { navigate } from '../utils/navigate';
import { usePageMeta } from '../hooks/usePageMeta';
import { OPERATOR } from '../data/operator';

const TermsPage = () => {
  usePageMeta({ title: 'Пользовательское соглашение — MØRA MART' });

  const goHome = () => {
    navigate('/');
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
              Пользовательское{' '}
              <span style={{ fontStyle: 'italic', color: 'var(--accent)' }}>
                соглашение
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
              <div
                style={{
                  padding: 24,
                  background: 'rgba(232,255,90,0.06)',
                  border: '1px solid rgba(232,255,90,0.2)',
                  borderRadius: 16,
                  fontSize: 15,
                  lineHeight: 1.7,
                }}
              >
                <strong style={{ color: 'var(--accent)', fontSize: 16 }}>
                  Платформа MØRA MART является информационным посредником
                </strong>
                <div style={{ marginTop: 8 }}>
                  Платформа предоставляет техническую возможность для размещения
                  товаров продавцами и не является продавцом, изготовителем,
                  импортёром или лицом, выполняющим работы/услуги. Все
                  обязательства по продаже товаров, их качеству, законности,
                  описанию и исполнению заказов несут исключительно продавцы.
                </div>
              </div>

              <h2
                className="serif"
                style={{ fontSize: 24, fontWeight: 900, marginTop: 16 }}
              >
                1. Общие положения
              </h2>
              <p>
                Настоящее Пользовательское соглашение (далее — «Соглашение»)
                регулирует отношения между Платформой{' '}
                <strong style={{ color: 'var(--text)' }}>MØRA MART</strong> (далее
                — «Платформа») и любым лицом, использующим сайт (далее —
                «Пользователь»).
              </p>
              <p>
                Использование Платформы означает полное и безоговорочное
                принятие условий настоящего Соглашения.
              </p>

              <h2
                className="serif"
                style={{ fontSize: 24, fontWeight: 900, marginTop: 16 }}
              >
                2. Роль Платформы
              </h2>
              <p>
                Платформа является{' '}
                <strong style={{ color: 'var(--text)' }}>
                  информационным посредником
                </strong>{' '}
                в соответствии со ст. 1253.1 Гражданского кодекса РФ. Платформа:
              </p>
              <ul
                style={{
                  paddingLeft: 24,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <li>Не производит, не хранит и не отчуждает товары</li>
                <li>Не является стороной сделки купли-продажи</li>
                <li>Не получает оплату от покупателей за товары</li>
                <li>Не несёт ответственности за качество товаров</li>
                <li>
                  Не несёт ответственности за достоверность информации,
                  размещённой продавцами
                </li>
              </ul>

              <h2
                className="serif"
                style={{ fontSize: 24, fontWeight: 900, marginTop: 16 }}
              >
                3. Ответственность продавца
              </h2>
              <p>
                Продавец, размещающий товары на Платформе, обязуется:
              </p>
              <ul
                style={{
                  paddingLeft: 24,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <li>
                  Предоставлять достоверную информацию о товаре, цене, качестве
                  и себе
                </li>
                <li>
                  Гарантировать законность продажи товара (включая соблюдение
                  прав на товарные знаки)
                </li>
                <li>
                  Исполнять заказы покупателей в соответствии с описанием
                </li>
                <li>
                  Соблюдать права потребителей в соответствии с
                  законодательством РФ
                </li>
                <li>
                  Нести полную ответственность за качество и безопасность товара
                </li>
              </ul>

              <h2
                className="serif"
                style={{ fontSize: 24, fontWeight: 900, marginTop: 16 }}
              >
                4. Оформление заказа
              </h2>
              <p>
                При оформлении заказа Покупатель заключает договор купли-продажи
                <strong style={{ color: 'var(--text)' }}>
                  {' '}
                  напрямую с продавцом
                </strong>
                , а не с Платформой. Платформа не является стороной этого
                договора и не несёт ответственности за его исполнение.
              </p>
              <p>
                Все вопросы, связанные с заказом (оплата, получение, качество,
                возврат), Покупатель решает напрямую с продавцом.
              </p>

              <h2
                className="serif"
                style={{ fontSize: 24, fontWeight: 900, marginTop: 16 }}
              >
                5. Отзывы и модерация
              </h2>
              <p>Платформа оставляет за собой право:</p>
              <ul
                style={{
                  paddingLeft: 24,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <li>Модерировать отзывы и удалять спам / оскорбления</li>
                <li>Блокировать продавцов за нарушение правил</li>
                <li>Удалять товары, нарушающие закон</li>
              </ul>
              <p>
                Платформа не несёт ответственности за содержание отзывов,
                оставленных пользователями.
              </p>

              <h2
                className="serif"
                style={{ fontSize: 24, fontWeight: 900, marginTop: 16 }}
              >
                6. Ограничение ответственности Платформы
              </h2>
              <p>Платформа не несёт ответственности за:</p>
              <ul
                style={{
                  paddingLeft: 24,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <li>Качество, безопасность и законность товаров</li>
                <li>Действия или бездействие продавцов</li>
                <li>Убытки, возникшие в результате сделки</li>
                <li>Временную недоступность сайта по техническим причинам</li>
                <li>
                  Действия третьих лиц (хакерские атаки, сбои хостинга)
                </li>
              </ul>

              <h2
                className="serif"
                style={{ fontSize: 24, fontWeight: 900, marginTop: 16 }}
              >
                7. Защита прав потребителей
              </h2>
              <p>
                Покупатель вправе предъявить требования, связанные с товаром,
                <strong style={{ color: 'var(--text)' }}>
                  {' '}
                  напрямую продавцу
                </strong>
                . Платформа оказывает содействие в поиске продавца и передаче
                обращения, но не несёт ответственности за результат.
              </p>

              <h2
                className="serif"
                style={{ fontSize: 24, fontWeight: 900, marginTop: 16 }}
              >
                8. Изменения
              </h2>
              <p>
                Платформа вправе изменять настоящее Соглашение в одностороннем
                порядке. Актуальная версия всегда доступна на этой странице.
              </p>

              <div
                style={{
                  marginTop: 32,
                  padding: 20,
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 16,
                  fontSize: 14,
                  color: 'var(--muted)',
                  lineHeight: 1.8,
                }}
              >
                <div style={{ marginBottom: 8 }}>
                  <strong style={{ color: 'var(--text)' }}>
                    Реквизиты Платформы:
                  </strong>
                </div>
                <div style={{ marginBottom: 6 }}>
                  <strong style={{ color: 'var(--text)' }}>ФИО:</strong>{' '}
                  {OPERATOR.legalName}
                </div>
                <div style={{ marginBottom: 6 }}>
                  <strong style={{ color: 'var(--text)' }}>Статус:</strong>{' '}
                  {OPERATOR.status}
                </div>
                <div style={{ marginBottom: 6 }}>
                  <strong style={{ color: 'var(--text)' }}>ИНН:</strong>{' '}
                  {OPERATOR.inn}
                </div>
                <div style={{ marginBottom: 6 }}>
                  <strong style={{ color: 'var(--text)' }}>Адрес:</strong>{' '}
                  {OPERATOR.address}
                </div>
                <div>
                  <strong style={{ color: 'var(--text)' }}>Email:</strong>{' '}
                  {OPERATOR.email}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TermsPage;
