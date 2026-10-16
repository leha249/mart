import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Wallet,
  ShoppingCart,
  TrendingUp,
  Users,
  Award,
  Loader2,
  AlertCircle,
  PieChart,
  Activity,
} from 'lucide-react';
import { analyticsService } from '../../services/analytics';
import type {
  DashboardMetrics,
  RevenueDay,
  TopProduct,
  StatusDistribution,
} from '../../services/analytics';
import { formatPrice } from '../../utils/format';
import MetricCard from './MetricCard';
import RevenueChart from './RevenueChart';
import BarChart from './charts/BarChart';
import DonutChart from './charts/DonutChart';
import Sparkline from './charts/Sparkline';
import Heatmap from './charts/Heatmap';
import TopProductsChart from './charts/TopProductsChart';

type Period = 7 | 30 | 90;

const Dashboard = () => {
  const [period, setPeriod] = useState<Period>(30);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [revenue, setRevenue] = useState<RevenueDay[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [statusDist, setStatusDist] = useState<StatusDistribution[]>([]);
  const [heatmap, setHeatmap] = useState<number[][]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetch = async () => {
      setLoading(true);
      setError(null);

      try {
        const [m, r, t, s, h] = await Promise.all([
          analyticsService.getMetrics(period),
          analyticsService.getRevenueByDay(period),
          analyticsService.getTopProducts(5),
          analyticsService.getStatusDistribution(),
          analyticsService.getHourlyActivity(period),
        ]);

        if (!mounted) return;
        setMetrics(m);
        setRevenue(r);
        setTopProducts(t);
        setStatusDist(s);
        setHeatmap(h);
      } catch (e) {
        if (mounted) {
          setError(e instanceof Error ? e.message : 'Ошибка загрузки');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetch();
    return () => {
      mounted = false;
    };
  }, [period]);

  const periods: { key: Period; label: string }[] = [
    { key: 7, label: '7 дней' },
    { key: 30, label: '30 дней' },
    { key: 90, label: '90 дней' },
  ];

  if (error) {
    return (
      <div
        style={{
          padding: 60,
          textAlign: 'center',
          color: 'var(--danger)',
        }}
      >
        <AlertCircle size={32} style={{ marginBottom: 12, opacity: 0.7 }} />
        <div style={{ fontSize: 14 }}>{error}</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div
        style={{
          display: 'flex',
          gap: 6,
          justifyContent: 'flex-end',
          flexWrap: 'wrap',
        }}
      >
        {periods.map((p) => (
          <button
            key={`period-${p.key}`}
            onClick={() => setPeriod(p.key)}
            style={{
              padding: '8px 16px',
              borderRadius: 100,
              border: '1px solid',
              borderColor:
                period === p.key ? 'var(--accent)' : 'var(--border)',
              background: period === p.key ? 'var(--accent)' : 'transparent',
              color: period === p.key ? '#000' : 'var(--muted)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all 0.2s',
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {loading && !metrics ? (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 100,
            color: 'var(--muted)',
            gap: 10,
          }}
        >
          <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
          Загрузка аналитики...
        </div>
      ) : metrics ? (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 16,
            }}
          >
            <MetricCard
              label="Выручка"
              value={formatPrice(metrics.revenue)}
              prevValue={metrics.revenuePrev}
              icon={<Wallet size={16} />}
              accent
              sparkline={
                <Sparkline
                  values={revenue.slice(-14).map((r) => r.revenue)}
                  width={90}
                  height={32}
                  color="var(--accent)"
                />
              }
            />
            <MetricCard
              label="Заказы"
              value={metrics.orders}
              prevValue={metrics.ordersPrev}
              icon={<ShoppingCart size={16} />}
              sparkline={
                <Sparkline
                  values={revenue.slice(-14).map((r) => r.orders_count)}
                  width={90}
                  height={32}
                  color="#60a5fa"
                />
              }
            />
            <MetricCard
              label="Средний чек"
              value={formatPrice(metrics.avgOrder)}
              prevValue={metrics.avgOrderPrev}
              icon={<TrendingUp size={16} />}
            />
            <MetricCard
              label="Уникальные клиенты"
              value={metrics.uniqueCustomers}
              icon={<Users size={16} />}
            />
          </div>

          <Section
            title="Выручка по дням"
            subtitle={formatPrice(metrics.revenue)}
          >
            <RevenueChart data={revenue} height={260} />
          </Section>

          <div
            className="dashboard-grid-2"
            style={{
              display: 'grid',
              gridTemplateColumns: '1.5fr 1fr',
              gap: 20,
            }}
          >
            <Section title="Заказы по дням" icon={<Activity size={14} />}>
              <BarChart
                data={revenue.slice(-14).map((r) => ({
                  label: r.day,
                  value: r.orders_count,
                  sublabel: new Date(r.day).toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'long',
                  }),
                }))}
                height={220}
                color="#60a5fa"
                valueFormatter={(v) => `${v} заказов`}
                labelFormatter={(l) => {
                  const d = new Date(l);
                  return d.toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'short',
                  });
                }}
              />
            </Section>

            <Section title="Статусы заказов" icon={<PieChart size={14} />}>
              <DonutChart data={statusDist} size={180} thickness={28} />
            </Section>
          </div>

          <Section title="Топ-5 товаров по продажам" icon={<Award size={14} />}>
            <TopProductsChart products={topProducts} />
          </Section>

          <Section
            title="Активность заказов по дням и часам"
            icon={<Activity size={14} />}
          >
            {heatmap.length > 0 ? (
              <Heatmap data={heatmap} />
            ) : (
              <div
                style={{
                  padding: 40,
                  textAlign: 'center',
                  color: 'var(--muted)',
                  fontSize: 13,
                }}
              >
                Нет данных об активности
              </div>
            )}
          </Section>
        </>
      ) : null}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @media (max-width: 900px) {
          .dashboard-grid-2 {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

interface SectionProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const Section = ({ title, subtitle, icon, children }: SectionProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    style={{
      padding: 24,
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 18,
    }}
  >
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        flexWrap: 'wrap',
        gap: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {icon && (
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: 'rgba(232,255,90,0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent)',
            }}
          >
            {icon}
          </div>
        )}
        <div
          style={{
            fontSize: 11,
            color: 'var(--muted)',
            letterSpacing: '1px',
            textTransform: 'uppercase',
            fontWeight: 600,
          }}
        >
          {title}
        </div>
      </div>
      {subtitle && (
        <div
          className="price-num"
          style={{
            fontSize: 20,
            fontWeight: 900,
            letterSpacing: '-0.5px',
          }}
        >
          {subtitle}
        </div>
      )}
    </div>
    {children}
  </motion.div>
);

export default Dashboard;