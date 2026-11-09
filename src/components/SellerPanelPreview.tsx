import { BarChart3, Package, ShoppingCart, Percent, Settings } from 'lucide-react';

/**
 * Декоративный превью кабинета продавца для страницы входа.
 * Это картинка из элементов интерфейса, а не рабочий экран:
 * нужна, чтобы левая часть не выглядела пустой.
 */
const SellerPanelPreview = () => {
  const bars = [38, 62, 44, 78, 52, 90, 66];
  const rows = [
    { name: 'Заказ 1', price: '7 999 ₽', status: 'новый' },
    { name: 'Заказ 2', price: '12 400 ₽', status: 'оплачен' },
    { name: 'Заказ 3', price: '4 900 ₽', status: 'отправлен' },
  ];

  return (
    <div className="sp">
      <div className="sp-window">
        <div className="sp-bar">
          <span className="sp-dot" />
          <span className="sp-dot" />
          <span className="sp-dot" />
          <span className="sp-url">mora.mart / кабинет</span>
        </div>

        <div className="sp-body">
          <div className="sp-side">
            {[BarChart3, Package, ShoppingCart, Percent, Settings].map(
              (Icon, i) => (
                <span key={i} className={`sp-side-item${i === 0 ? ' is-on' : ''}`}>
                  <Icon size={12} />
                </span>
              )
            )}
          </div>

          <div className="sp-main">
            <div className="sp-metrics">
              <div className="sp-metric">
                <span className="sp-metric-label">Выручка</span>
                <span className="sp-metric-value">23 997 ₽</span>
              </div>
              <div className="sp-metric">
                <span className="sp-metric-label">Заказы</span>
                <span className="sp-metric-value">3</span>
              </div>
              <div className="sp-metric">
                <span className="sp-metric-label">Комиссия</span>
                <span className="sp-metric-value sp-accent">960 ₽</span>
              </div>
            </div>

            <div className="sp-chart">
              {bars.map((h, i) => (
                <span
                  key={i}
                  className={`sp-bar-col${i === 5 ? ' is-top' : ''}`}
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>

            <div className="sp-rows">
              {rows.map((r) => (
                <div key={r.name} className="sp-row">
                  <span className="sp-row-name">{r.name}</span>
                  <span className="sp-row-price">{r.price}</span>
                  <span className="sp-row-status">{r.status}</span>
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
          filter: drop-shadow(0 40px 80px rgba(0,0,0,.65));
          animation: sp-float 9s ease-in-out infinite;
          will-change: transform;
        }

        .sp-window {
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,.10);
          background: linear-gradient(180deg, #141414 0%, #0c0c0c 100%);
          overflow: hidden;
        }

        .sp-bar {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 9px 12px;
          border-bottom: 1px solid rgba(255,255,255,.07);
        }

        .sp-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: rgba(255,255,255,.16);
        }

        .sp-url {
          margin-left: 8px;
          font-size: 10.5px;
          color: rgba(255,255,255,.30);
          letter-spacing: .02em;
        }

        .sp-body { display: flex; }

        .sp-side {
          width: 44px;
          padding: 12px 0;
          border-right: 1px solid rgba(255,255,255,.06);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .sp-side-item {
          width: 28px;
          height: 28px;
          border-radius: 7px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(255,255,255,.28);
        }

        .sp-side-item.is-on {
          background: rgba(232,255,90,.12);
          color: #e8ff5a;
        }

        .sp-main { flex: 1; padding: 12px; display: flex; flex-direction: column; gap: 10px; }

        .sp-metrics { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }

        .sp-metric {
          padding: 8px 9px;
          border-radius: 9px;
          background: rgba(255,255,255,.035);
          border: 1px solid rgba(255,255,255,.06);
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .sp-metric-label { font-size: 8.5px; text-transform: uppercase; letter-spacing: .08em; color: rgba(255,255,255,.35); }
        .sp-metric-value { font-size: 14px; font-weight: 700; color: #f2f2f2; }
        .sp-accent { color: #e8ff5a; }

        .sp-chart {
          height: 76px;
          display: flex;
          align-items: flex-end;
          gap: 6px;
          padding: 8px 6px 0;
          border-radius: 9px;
          background: rgba(255,255,255,.02);
          border: 1px solid rgba(255,255,255,.05);
        }

        .sp-bar-col {
          flex: 1;
          border-radius: 3px 3px 0 0;
          background: rgba(232,255,90,.22);
        }

        .sp-bar-col.is-top { background: #e8ff5a; }

        .sp-rows { display: flex; flex-direction: column; gap: 5px; }

        .sp-row {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 8px;
          border-radius: 7px;
          background: rgba(255,255,255,.025);
          font-size: 10px;
        }

        .sp-row-name {
          flex: 1;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: rgba(255,255,255,.62);
        }

        .sp-row-price { color: rgba(255,255,255,.85); font-weight: 600; }
        .sp-row-status { color: rgba(232,255,90,.85); }

        @media (prefers-reduced-motion: reduce) {
          .sp { animation: none !important; }
        }
      `}</style>
    </div>
  );
};

export default SellerPanelPreview;
