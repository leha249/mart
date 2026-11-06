import { motion } from 'framer-motion';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Cursor from '../components/Cursor';
import ScrollProgress from '../components/ScrollProgress';
import { navigate } from '../utils/navigate';
import { usePageMeta } from '../hooks/usePageMeta';
import { OPERATOR } from '../data/operator';

const SellerAgreementPage = () => {
  usePageMeta({ title: 'Оферта для продавцов — MØRA MART' });

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
              • Для продавцов
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
              Публичная{' '}
              <span style={{ fontStyle: 'italic', color: 'var(--accent)' }}>
                оферта
              </span>
            </h1>
            <p
              style={{
                fontSize: 14,
                color: 'var(--muted)',
                marginBottom: 40,
              }}
            >
              Договор-оферта для продавцов платформы MØRA MART. Редакция от 17
              октября 2026 г.
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
                  background: 'rgba(255,77,77,0.08)',
                  border: '1px solid rgba(255,77,77,0.3)',
                  borderRadius: 16,
                  fontSize: 15,
                  lineHeight: 1.7,
                  display: 'flex',
                  gap: 16,
                }}
              >
                <AlertTriangle
                  size={24}
                  color="var(--danger)"
                  style={{ flexShrink: 0, marginTop: 2 }}
                />
                <div>
                  <strong style={{ color: 'var(--danger)' }}>
                    Прочитайте внимательно
                  </strong>
                  <div style={{ marginTop: 8, color: 'var(--text-dim)' }}>
                    Размещая товары на платформе MØRA MART, вы принимаете
                    настоящую оферту и берёте на себя полную ответственность за
                    качество, законность, доставку, возврат и исполнение заказов.
                    Платформа является только техническим посредником.
                  </div>
                </div>
              </div>

              <h2
                className="serif"
                style={{ fontSize: 24, fontWeight: 900, marginTop: 16 }}
              >
                1. Предмет договора
              </h2>
              <p>
                Платформа{' '}
                <strong style={{ color: 'var(--text)' }}>MØRA MART</strong>{' '}
                предоставляет Продавцу техническую возможность для размещения
                товаров и получения заказов от покупателей. Платформа не является
                стороной сделки купли-продажи между Продавцом и Покупателем.
              </p>

              <h2
                className="serif"
                style={{ fontSize: 24, fontWeight: 900, marginTop: 16 }}
              >
                2. Требования к продавцу
              </h2>
              <p>Продавец обязуется:</p>
              <ul
                style={{
                  paddingLeft: 24,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <li>
                  Быть дееспособным лицом (или ИП/ООО) и иметь право на продажу
                  товаров
                </li>
                <li>
                  Предоставлять достоверную информацию о себе и товарах
                </li>
                <li>
                  Не размещать товары, запрещённые к обороту в РФ (наркотики,
                  оружие, контрафакт и т.п.)
                </li>
                <li>
                  Соблюдать права потребителей (Закон РФ «О защите прав
                  потребителей»)
                </li>
                <li>Соблюдать налоговое законодательство</li>
              </ul>

              <h2
                className="serif"
                style={{ fontSize: 24, fontWeight: 900, marginTop: 16 }}
              >
                3. Ответственность продавца
              </h2>
              <p>
                <strong style={{ color: 'var(--text)' }}>
                  Продавец несёт полную ответственность за:
                </strong>
              </p>
              <ul
                style={{
                  paddingLeft: 24,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <li>Качество и безопасность товаров</li>
                <li>Достоверность описания и фотографий товара</li>
                <li>Законность продажи (включая права на товарные знаки)</li>
                <li>
                  Исполнение заказов в срок и в соответствии с описанием
                </li>
                <li>
                  Урегулирование претензий и споров с покупателями
                </li>
                <li>Уплату налогов с дохода от продаж</li>
              </ul>

              <h2
                className="serif"
                style={{ fontSize: 24, fontWeight: 900, marginTop: 16 }}
              >
                4. Доставка и передача товара
              </h2>
              <p>
                <strong style={{ color: 'var(--text)' }}>
                  Продавец самостоятельно организует доставку товара Покупателю.
                </strong>{' '}
                Платформа не участвует в процессе доставки, не хранит товары и не
                несёт ответственности за:
              </p>
              <ul
                style={{
                  paddingLeft: 24,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <li>Сроки доставки</li>
                <li>Сохранность товара при доставке</li>
                <li>Повреждение или утрату товара в пути</li>
                <li>Ошибки в адресе или способе доставки</li>
                <li>Любые расходы, связанные с доставкой</li>
              </ul>
              <p>
                Все вопросы, связанные с доставкой, Покупатель решает
                <strong style={{ color: 'var(--text)' }}>
                  {' '}
                  напрямую с Продавцом
                </strong>
                .
              </p>

              <h2
                className="serif"
                style={{ fontSize: 24, fontWeight: 900, marginTop: 16 }}
              >
                5. Возврат и обмен товара
              </h2>
              <p>
                <strong style={{ color: 'var(--text)' }}>
                  Продавец самостоятельно рассматривает и удовлетворяет
                  требования Покупателя о возврате и обмене товара
                </strong>{' '}
                в соответствии с Законом РФ «О защите прав потребителей».
              </p>
              <p>Продавец обязуется:</p>
              <ul
                style={{
                  paddingLeft: 24,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <li>
                  Принимать возврат товара надлежащего качества в течение 14
                  дней с момента получения (если товар не был в употреблении,
                  сохранены бирки и упаковка)
                </li>
                <li>
                  Принимать возврат товара ненадлежащего качества (брак) в
                  течение гарантийного срока
                </li>
                <li>
                  Организовывать возврат денежных средств Покупателю
                  самостоятельно и в сроки, установленные законом
                </li>
                <li>
                  Нести все расходы, связанные с возвратом и обменом товара
                </li>
              </ul>
              <p>
                <strong style={{ color: 'var(--text)' }}>
                  Платформа не участвует в процессе возврата и не компенсирует
                  расходы Продавца или Покупателя.
                </strong>
              </p>

              <h2
                className="serif"
                style={{ fontSize: 24, fontWeight: 900, marginTop: 16 }}
              >
                6. Товары, не подлежащие возврату
              </h2>
              <p>
                В соответствии с Постановлением Правительства РФ № 2463,
                возврату и обмену не подлежат:
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
                  Товары личной гигиены (нижнее бельё, носки, купальники)
                </li>
                <li>
                  Товары индивидуального пошива и персонализации
                </li>
                <li>Товары, бывшие в употреблении</li>
                <li>Товары без оригинальной упаковки и бирок</li>
              </ul>
              <p>
                Продавец обязан уведомить Покупателя о невозвратности товара до
                оформления заказа.
              </p>

              <h2
                className="serif"
                style={{ fontSize: 24, fontWeight: 900, marginTop: 16 }}
              >
                7. Запрещённые товары
              </h2>
              <p>На платформе запрещено размещать:</p>
              <ul
                style={{
                  paddingLeft: 24,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <li>Контрафакт и подделки</li>
                <li>Оружие, наркотики, табак, алкоголь</li>
                <li>Товары, нарушающие авторские права</li>
                <li>Порнографию, экстремистские материалы</li>
                <li>Лекарства и медицинские изделия без лицензии</li>
                <li>Любые товары, запрещённые законом РФ</li>
              </ul>
              <p>
                При выявлении запрещённого товара Платформа удаляет его, а
                Продавец может быть заблокирован.
              </p>

              <h2
                className="serif"
                style={{ fontSize: 24, fontWeight: 900, marginTop: 16 }}
              >
                8. Комиссия платформы
              </h2>
              <p>
                Платформа не взимает абонентскую плату и не берёт плату за
                регистрацию. Вознаграждение платформы — комиссия 4% от суммы
                заказа (без учёта доставки). Актуальный размер комиссии указан в
                кабинете продавца; платформа вправе изменить его, уведомив
                продавца заранее.
              </p>
              <p>
                Комиссия начисляется по каждому заказу, кроме отменённых, и
                фиксируется в заказе. Продавец оплачивает накопленную комиссию
                переводом по реквизитам, указанным в кабинете, и нажимает «Я
                перевёл»; платформа подтверждает поступление. Текущая
                задолженность отображается в кабинете.
              </p>
              <p>
                Покупатели не уплачивают платформе вознаграждение. Стоимость
                товара, доставка и порядок расчётов определяются между
                покупателем и продавцом напрямую; платформа стороной этих
                расчётов не является и платежи за товар не принимает.
              </p>
              <p>
                Если комиссия не оплачена, платформа вправе после уведомления
                ограничить доступ продавца к приёму новых заказов до погашения
                задолженности. Данные при этом сохраняются.
              </p>

              <h2
                className="serif"
                style={{ fontSize: 24, fontWeight: 900, marginTop: 16 }}
              >
                9. Модерация и блокировка
              </h2>
              <p>
                Платформа оставляет за собой право без предупреждения:
              </p>
              <ul
                style={{
                  paddingLeft: 24,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <li>Удалять товары, нарушающие правила</li>
                <li>
                  Блокировать или удалять аккаунт Продавца за нарушение оферты
                </li>
                <li>Отклонять отзывы, содержащие спам или оскорбления</li>
              </ul>

              <h2
                className="serif"
                style={{ fontSize: 24, fontWeight: 900, marginTop: 16 }}
              >
                10. Персональные данные
              </h2>
              <p>
                Продавец получает персональные данные покупателя (имя, телефон,
                email) для исполнения заказа. Продавец обязуется:
              </p>
              <ul
                style={{
                  paddingLeft: 24,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <li>Не передавать данные третьим лицам</li>
                <li>Не использовать данные для рассылок без согласия</li>
                <li>
                  Обеспечить защиту данных в соответствии с 152-ФЗ
                </li>
              </ul>

              <h2
                className="serif"
                style={{ fontSize: 24, fontWeight: 900, marginTop: 16 }}
              >
                11. Принятие оферты
              </h2>
              <p>
                Размещая первый товар на платформе, Продавец подтверждает, что
                ознакомился с настоящей офертой и принимает все её условия.
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
                    Реквизиты платформы:
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

export default SellerAgreementPage;
