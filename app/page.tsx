'use client';

import { useEffect, useMemo, useState } from 'react';
import DateControl from './components/DateControl';
import CeoSummary from './components/CeoSummary';
import GoogleOS from './components/GoogleOS';
import MetaOS from './components/MetaOS';
import ProductOS from './components/ProductOS';

type Row = any;
type MetaParams = {
  targetRoas: number;
  targetCpa: number;
  scalePct: number;
  killPct: number;
  minSpend: number;
  minPurchases: number;
  maxCpa: number;
  minRoas: number;
  minCtr: number;
  maxFrequency: number;
  cpmIncreasePct: number;
};

const DEFAULT_PARAMS: MetaParams = {
  targetRoas: 0.8,
  targetCpa: 1800,
  scalePct: 10,
  killPct: 15,
  minSpend: 10000,
  minPurchases: 3,
  maxCpa: 2200,
  minRoas: 0.7,
  minCtr: 0.8,
  maxFrequency: 2.5,
  cpmIncreasePct: 20,
};

const formatCurrency = (value: number = 0) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const formatNumber = (value: number = 0, digits = 2) =>
  new Intl.NumberFormat('en-IN', { maximumFractionDigits: digits }).format(Number(value || 0));

const pctChange = (current: number, previous: number) => {
  if (!previous || previous === 0) return 0;
  return ((Number(current || 0) - Number(previous || 0)) / Number(previous || 0)) * 100;
};

const safeDivide = (a: any, b: any) => {
  const numerator = Number(a || 0);
  const denominator = Number(b || 0);
  if (!denominator) return 0;
  return numerator / denominator;
};

const sum = (rows: Row[], key: string) => rows.reduce((acc, row) => acc + Number(row[key] || 0), 0);

export default function Dashboard() {
  const formatDate = (d: Date) => d.toISOString().split("T")[0];

  const setPreset = (preset: "yesterday" | "l7" | "l14" | "l30" | "mtd" | "lastMonth") => {
    const today = new Date();

    let currentStart = new Date();
    let currentEnd = new Date();

    if (preset === "yesterday") {
      const y = new Date(today);
      y.setDate(today.getDate() - 1);

      currentStart = y;
      currentEnd = y;
    }

    if (preset === "l7") {
      currentEnd = today;
      currentStart = new Date(today);
      currentStart.setDate(today.getDate() - 6);
    }

    if (preset === "l14") {
      currentEnd = today;
      currentStart = new Date(today);
      currentStart.setDate(today.getDate() - 13);
    }

    if (preset === "l30") {
      currentEnd = today;
      currentStart = new Date(today);
      currentStart.setDate(today.getDate() - 29);
    }

    if (preset === "mtd") {
      currentEnd = today;
      currentStart = new Date(today.getFullYear(), today.getMonth(), 1);
    }

    if (preset === "lastMonth") {
      currentStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      currentEnd = new Date(today.getFullYear(), today.getMonth(), 0);
    }

    const days =
      Math.round(
        (currentEnd.getTime() - currentStart.getTime()) / (1000 * 60 * 60 * 24)
      ) + 1;

    const compareEndDate = new Date(currentStart);
    compareEndDate.setDate(currentStart.getDate() - 1);

    const compareStartDate = new Date(compareEndDate);
    compareStartDate.setDate(compareEndDate.getDate() - days + 1);

    setStart(formatDate(currentStart));
    setEnd(formatDate(currentEnd));
    setCompareStart(formatDate(compareStartDate));
    setCompareEnd(formatDate(compareEndDate));
  };
  
  const [activeTab, setActiveTab] = useState('CEO Summary');
  const [activeMetaTab, setActiveMetaTab] = useState('Settings');
  const today = new Date();

  const format = (d: Date) => d.toISOString().split("T")[0];

  // current period (last 30 days)
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 29);

  // compare period (previous 30 days)
  const compareEndDate = new Date(startDate);
  compareEndDate.setDate(startDate.getDate() - 1);

  const compareStartDate = new Date(compareEndDate);
  compareStartDate.setDate(compareEndDate.getDate() - 29);

  const [start, setStart] = useState(format(startDate));
  const [end, setEnd] = useState(format(endDate));
  const [compareStart, setCompareStart] = useState(format(compareStartDate));
  const [compareEnd, setCompareEnd] = useState(format(compareEndDate));

  const [data, setData] = useState<Row[]>([]);
  const [compareData, setCompareData] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const currentRes = await fetch(`/api/ceo-summary?start=${start}&end=${end}`);
      const currentJson = await currentRes.json();

      const compareRes = await fetch(`/api/ceo-summary?start=${compareStart}&end=${compareEnd}`);
      const compareJson = await compareRes.json();

      setData(Array.isArray(currentJson) ? currentJson : []);
      setCompareData(Array.isArray(compareJson) ? compareJson : []);
    } catch (error) {
      console.error('Dashboard fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const metrics = useMemo(() => {
    const revenue = sum(data, 'revenue');
    const spend = sum(data, 'total_spend');
    const metaSpend = sum(data, 'meta_spend');
    const googleSpend = sum(data, 'google_spend');
    const metaRevenue = sum(data, 'meta_revenue');
    const googleRevenue = sum(data, 'google_revenue');
    const orders = sum(data, 'orders');
    const customers = sum(data, 'customers');
    const newCustomers = sum(data, 'new_customers');
    const repeatCustomers = sum(data, 'repeat_customers');
    const newRevenue = sum(data, 'new_customer_revenue');
    const repeatRevenue = sum(data, 'repeat_customer_revenue');

    const cRevenue = sum(compareData, 'revenue');
    const cSpend = sum(compareData, 'total_spend');
    const cNewCustomers = sum(compareData, 'new_customers');
    const roas = safeDivide(revenue, spend);
    const cRoas = safeDivide(cRevenue, cSpend);
    const newCac = safeDivide(spend, newCustomers);
    const cNewCac = safeDivide(cSpend, cNewCustomers);

    return {
      revenue,
      spend,
      contribution: revenue - spend,
      roas,
      roi: safeDivide(revenue - spend, spend),
      cac: safeDivide(spend, customers),
      newCac,
      aov: safeDivide(revenue, orders),
      orders,
      customers,
      newCustomers,
      repeatCustomers,
      newRevenue,
      repeatRevenue,
      metaSpend,
      googleSpend,
      metaRevenue,
      googleRevenue,
      organicRevenue: Math.max(revenue - metaRevenue - googleRevenue, 0),
      revenueDelta: pctChange(revenue, cRevenue),
      spendDelta: pctChange(spend, cSpend),
      roasDelta: pctChange(roas, cRoas),
      newCacDelta: pctChange(newCac, cNewCac),
      repeatRevenuePct: safeDivide(repeatRevenue, revenue) * 100,
      newRevenuePct: safeDivide(newRevenue, revenue) * 100,
    };
  }, [data, compareData]);

  const tabs = ['CEO Summary', 'Meta OS', 'Google OS', 'Retention OS', 'Product OS'];

  return (
    <main className="min-h-screen bg-[#090d16] text-slate-100">
      <div className="flex min-h-screen">
        <aside className="sticky top-0 hidden h-screen w-72 shrink-0 border-r border-white/10 bg-[#0b1020] p-6 lg:block">
          <div className="mb-9">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-lg font-black text-slate-950 shadow-[0_0_40px_rgba(255,255,255,0.18)]">
              GO
            </div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-300">GrowthOS</p>
            <h1 className="mt-2 text-2xl font-black tracking-[-0.06em] text-white">Command Center</h1>
            <p className="mt-2 text-sm leading-6 text-slate-400">CEO-grade operating system for revenue, media, customers and inventory decisions.</p>
          </div>

          <nav className="space-y-2">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={
                  activeTab === tab
                    ? 'flex w-full items-center justify-between rounded-2xl bg-white px-4 py-3 text-left text-sm font-black text-slate-950 shadow-[0_18px_60px_rgba(255,255,255,0.16)]'
                    : 'flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-bold text-slate-400 hover:bg-white/10 hover:text-white'
                }
              >
                <span>{tab}</span>
                <span className={activeTab === tab ? 'h-2 w-2 rounded-full bg-emerald-500' : 'h-2 w-2 rounded-full bg-slate-700'} />
              </button>
            ))}
          </nav>

          <div className="absolute bottom-6 left-6 right-6 rounded-3xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs font-black uppercase tracking-widest text-slate-500">Status</p>
            <div className="mt-3 flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
              </span>
              <span className="text-sm font-black text-white">{loading ? 'Syncing data' : 'Live data'}</span>
            </div>
          </div>
        </aside>

        <section className="flex-1 overflow-hidden bg-[radial-gradient(circle_at_20%_0%,rgba(34,211,238,0.16),transparent_28%),radial-gradient(circle_at_90%_10%,rgba(16,185,129,0.12),transparent_24%),linear-gradient(180deg,#0f172a_0%,#f8fafc_38%)]">
          <div className="mx-auto max-w-[1600px] p-4 md:p-8">
            <header className="mb-6 rounded-[2rem] border border-white/10 bg-white/[0.08] p-5 shadow-2xl shadow-slate-950/20 backdrop-blur-2xl md:p-7">
              <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.26em] text-cyan-200">{activeTab}</p>
                  <h2 className="mt-2 text-3xl font-black tracking-[-0.06em] text-white md:text-5xl">GrowthOS Dashboard</h2>
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">Revenue, spend, channel efficiency, customer quality and decision alerts in one operating cockpit.</p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-right sm:grid-cols-4">
                  <HeroPill label="Revenue" value={formatCurrency(metrics.revenue)} />
                  <HeroPill label="Spend" value={formatCurrency(metrics.spend)} />
                  <HeroPill label="ROAS" value={formatNumber(metrics.roas)} />
                  <HeroPill label="New CAC" value={formatCurrency(metrics.newCac)} />
                </div>
              </div>

              <nav className="mt-6 flex gap-2 overflow-x-auto rounded-2xl bg-slate-950/55 p-2 lg:hidden">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={
                      activeTab === tab
                        ? 'whitespace-nowrap rounded-xl bg-white px-4 py-2 text-sm font-black text-slate-950'
                        : 'whitespace-nowrap rounded-xl px-4 py-2 text-sm font-bold text-slate-400'
                    }
                  >
                    {tab}
                  </button>
                ))}
              </nav>
            </header>

            <DateControl
              start={start}
              end={end}
              compareStart={compareStart}
              compareEnd={compareEnd}
              setStart={setStart}
              setEnd={setEnd}
              setCompareStart={setCompareStart}
              setCompareEnd={setCompareEnd}
              onApply={fetchData}
              loading={loading}
              setPreset={setPreset}
            />

            <div className="text-slate-950">
              {activeTab === 'CEO Summary' && <CeoSummary metrics={metrics} data={data} />}

              {activeTab === 'Meta OS' && (
                <MetaOS
                  activeMetaTab={activeMetaTab}
                  setActiveMetaTab={setActiveMetaTab}
                  start={start}
                  end={end}
                  compareStart={compareStart}
                  compareEnd={compareEnd}
                />
              )}

              {activeTab === 'Google OS' && (
                <GoogleOS 
                  startDate={start}
                  endDate={end}
                  compareStartDate={compareStart}
                  compareEndDate={compareEnd}                
                />
              )}

              {activeTab === 'Product OS' && (
                <ProductOS
                  startDate={start}
                  endDate={end}
                  compareStartDate={compareStart}
                  compareEndDate={compareEnd}
                />
              )}

              {activeTab !== 'CEO Summary' && activeTab !== 'Meta OS' && activeTab !== 'Google OS' && activeTab !== 'Product OS' && (
                <section className="rounded-[2rem] border border-white/70 bg-white/90 p-10 shadow-2xl shadow-slate-200/70 backdrop-blur-xl">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">Coming Next</p>
                  <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] text-slate-950">{activeTab}</h2>
                  <p className="mt-2 text-slate-500">This GrowthOS module will come next.</p>
                </section>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function HeroPill({ label, value }: any) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.08] px-4 py-3 backdrop-blur-xl">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-black text-white md:text-base">{value}</p>
    </div>
  );
}