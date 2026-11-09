import { BarChart3, Package, ShoppingCart, Percent, Settings, MessageCircle } from 'lucide-react';

/**
 * Декоративный превью кабинета продавца для страницы входа.
 * Это картинка из элементов интерфейса, а не рабочий экран:
 * нужна, чтобы левая часть не выглядела пустой.
 */
const SellerPanelPreview = () => {
  const bars = [28, 46, 36, 58, 44, 72, 52, 88, 63, 74, 58, 96];
  const rows = [
    { name: 'Заказ 1', price: '7 999 ₽', status: 'новый', tone: 'new' },
    { name: 'Заказ 2', price: '12 400 ₽', status: 'оплачен', tone: 'ok' },
    { name: 'Заказ 3', price: '4 900 ₽', status: 'отправлен', tone: 'ship' },
    { name: 'Заказ 4', price: '15 700 ₽', status: 'доставлен', tone: 'done' },
    { name: 'Заказ 5', price: '3 200 ₽', status: 'оплачен', tone: 'ok' },
  ];

  return (
    <div className="sp">
      <div className="sp-window">
        <div className="sp-bar">
          <span className="sp-dot" />
          <span className="sp-dot" />
          <span className="sp-dot" />
          <span className="sp-url">mora.mart / кабинет продавца</span>
          <span className="sp-pill">7 дней</span>
        </div>

        <div className="sp-body">
          <div className="sp-side">
            {[BarChart3, Package, ShoppingCart, Percent, MessageCircle, Settings].map(
              (Icon, i) => (
                <span key={i} className={`sp-side-item${i === 0 ? ' is-on' : ''}`}>
                  <Icon size={13} />
                </span>
              )
            )}
          </div>

          <div className="sp-main">
            <div className="sp-head">
              <span className="sp-head-title">Дашборд</span>
              <span className="sp-head-sub">выручка за неделю</span>
            </div>

            <div className="sp-metrics">
              <div className="sp-metric">
                <span className="sp-metric-label">Выручка</span>
                <span className="sp-metric-value">23 997 ₽</span>
                <span className="sp-metric-diff">+18%</span>
              </div>
              <div className="sp-metric">
                <span className="sp-metric-label">Заказы</span>
                <span className="sp-metric-value">3</span>
                <span className="sp-metric-diff">+2</span>
              </div>
              <div className="sp-metric">
                <span className="sp-metric-label">Комиссия</span>
                <span className="sp-metric-value sp-accent">960 ₽</span>
                <span className="sp-metric-diff sp-accent">4%</span>
              </div>
            </div>

            <div className="sp-chart">
              {bars.map((h, i) => (
                <span
                  key={i}
                  className={`sp-bar-col${i === bars.length - 1 ? ' is-top' : ''}`}
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>

            <div className="sp-table">
              <div className="sp-table-head">
                <span>Заказ</span>
                <span>Сумма</span>
                <span>Статус</span>
              </div>
              {rows.map((r) => (
                <div key={r.name} className="sp-row">
                  <span className="sp-row-name">{r.name}</span>
                  <span className="sp-row-price">{r.price}</span>
                  <span className={`sp-row-status sp-${r.tone}`}>{r.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes sp-float {
          0%, 100% { transform: translate3d(0, 0, 0); }
          50% { transform: translate3d(0, -10px, 0); }
        }

        .sp {
          width: 100%;
          filter: drop-shadow(0 44px 90px rgba(0,0,0,.7));
          animation: sp-float 9s ease-in-out infinite;
          will-change: transform;
        }

        .sp-window {
          border-radius: 20px;
          border: 1px solid rgba(255,255,255,.11);
          background: linear-gradient(180deg, #151515 0%, #0b0b0b 100%);
          overflow: hidden;
        }

        .sp-bar {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 14px 18px;
          border-bottom: 1px solid rgba(255,255,255,.07);
          background: rgba(255,255,255,.015);
        }

        .sp-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: rgba(255,255,255,.17);
        }

        .sp-url {
          margin-left: 12px;
          font-size: 13.5px;
          color: rgba(255,255,255,.32);
          letter-spacing: .01em;
        }

        .sp-pill {
          margin-left: auto;
          padding: 4px 11px;
          border-radius: 100px;
          border: 1px solid rgba(255,255,255,.10);
          font-size: 11.5px;
          color: rgba(255,255,255,.45);
        }

        .sp-body { display: flex; }

        .sp-side {
          width: 64px;
          padding: 18px 0;
          border-right: 1px solid rgba(255,255,255,.06);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .sp-side-item {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(255,255,255,.26);
        }

        .sp-side-item.is-on {
          background: rgba(232,255,90,.13);
          color: #e8ff5a;
        }

        .sp-main { flex: 1; padding: 18px 20px 20px; display: flex; flex-direction: column; gap: 15px; }

        .sp-head { display: flex; align-items: baseline; gap: 8px; }
        .sp-head-title { font-size: 16px; font-weight: 700; color: rgba(255,255,255,.88); }
        .sp-head-sub { font-size: 12px; color: rgba(255,255,255,.3); }

        .sp-metrics { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }

        .sp-metric {
          padding: 12px 13px;
          border-radius: 10px;
          background: rgba(255,255,255,.035);
          border: 1px solid rgba(255,255,255,.06);
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .sp-metric-label { font-size: 11px; text-transform: uppercase; letter-spacing: .09em; color: rgba(255,255,255,.34); }
        .sp-metric-value { font-size: 18px; font-weight: 700; color: #f4f4f4; line-height: 1.1; }
        .sp-metric-diff { font-size: 11.5px; color: rgba(255,255,255,.38); }
        .sp-accent { color: #e8ff5a; }

        .sp-chart {
          height: 112px;
          display: flex;
          align-items: flex-end;
          gap: 9px;
          padding: 12px 12px 0;
          border-radius: 10px;
          background:
            linear-gradient(180deg, rgba(255,255,255,.03) 0%, transparent 70%),
            rgba(255,255,255,.015);
          border: 1px solid rgba(255,255,255,.055);
        }

        .sp-bar-col {
          flex: 1;
          border-radius: 3px 3px 0 0;
          background: rgba(232,255,90,.20);
        }

        .sp-bar-col.is-top { background: #e8ff5a; }

        .sp-table { display: flex; flex-direction: column; gap: 4px; }

        .sp-table-head {
          display: grid;
          grid-template-columns: 1fr 112px 102px;
          gap: 10px;
          padding: 0 11px 5px;
          font-size: 10.5px;
          letter-spacing: .1em;
          text-transform: uppercase;
          color: rgba(255,255,255,.26);
        }

        .sp-table-head span:nth-child(2) { text-align: right; }
        .sp-table-head span:nth-child(3) { text-align: right; }

        .sp-row {
          display: grid;
          grid-template-columns: 1fr 112px 102px;
          gap: 10px;
          align-items: center;
          padding: 9px 11px;
          border-radius: 8px;
          background: rgba(255,255,255,.025);
          font-size: 12.5px;
        }

        .sp-row-name {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: rgba(255,255,255,.66);
        }

        .sp-row-price { text-align: right; color: rgba(255,255,255,.88); font-weight: 600; }

        .sp-row-status { text-align: right; font-size: 11.5px; }
        .sp-new { color: rgba(255,255,255,.45); }
        .sp-ok { color: rgba(232,255,90,.9); }
        .sp-ship { color: rgba(120,190,255,.85); }
        .sp-done { color: rgba(120,220,150,.8); }

        @media (prefers-reduced-motion: reduce) {
          .sp { animation: none !important; }
        }
      `}</style>
    </div>
  );
};

export default SellerPanelPreview;
