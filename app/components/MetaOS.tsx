'use client';

import { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
  BarChart,
  Bar,
} from 'recharts';

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

export default function MetaOS({
  activeMetaTab,
  setActiveMetaTab,
  start,
  end,
  compareStart,
  compareEnd,
}: any) {
  const [params, setParams] = useState<MetaParams>(DEFAULT_PARAMS);
  const [campaigns, setCampaigns] = useState<string[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState('');

  useEffect(() => {
    async function fetchCampaigns() {
      try {
        const res = await fetch(`/api/meta-os?tab=campaign-list&start=${start}&end=${end}`);
        const json = await res.json();
        const names = Array.isArray(json) ? json.map((x: any) => x.campaign_name).filter(Boolean) : [];
        setCampaigns(names);
        setSelectedCampaign((prev) => (names.length > 0 && !names.includes(prev) ? names[0] : prev));
      } catch (error) {
        console.error('Campaign list error', error);
      }
    }

    fetchCampaigns();
  }, [start, end]);

  const metaTabs = [
    'Settings',
    'Overview',
    'Campaign Analysis',
    'Ad Set Analysis',
    'Creative Analysis',
    'Funnel Analysis',
    'Alerts & Recommendations',
  ];

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white/95 p-4 shadow-2xl shadow-slate-200/70 sm:p-6">
      <div className="mb-6">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">Meta OS</p>
        <h2 className="mt-1 text-2xl font-black tracking-[-0.05em] text-slate-950 sm:text-3xl">
          Performance Decision System
        </h2>
        <p className="mt-1 text-sm text-slate-500 sm:text-base">
          Lean operator view for spend, ROAS, CPA, funnel health, creative signals and alerts.
        </p>
      </div>

      <div className="mb-6 flex max-w-full gap-2 overflow-x-auto rounded-2xl bg-slate-950 p-2 shadow-inner">
        {metaTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveMetaTab(tab)}
            className={
              activeMetaTab === tab
                ? 'whitespace-nowrap rounded-xl bg-white px-4 py-2 text-sm font-black text-slate-950 shadow-sm'
                : 'whitespace-nowrap rounded-xl px-4 py-2 text-sm font-bold text-slate-400 hover:bg-white/10 hover:text-white'
            }
          >
            {tab}
          </button>
        ))}
      </div>

      {activeMetaTab === 'Settings' && <MetaSettings params={params} setParams={setParams} />}
      {activeMetaTab === 'Overview' && (
        <MetaOverview start={start} end={end} compareStart={compareStart} compareEnd={compareEnd} params={params} />
      )}
      {activeMetaTab === 'Campaign Analysis' && <MetaCampaignAnalysis start={start} end={end} params={params} />}
      {activeMetaTab === 'Ad Set Analysis' && (
        <MetaAdSetAnalysis
          start={start}
          end={end}
          params={params}
          campaigns={campaigns}
          selectedCampaign={selectedCampaign}
          setSelectedCampaign={setSelectedCampaign}
        />
      )}
      {activeMetaTab === 'Creative Analysis' && (
        <MetaCreativeAnalysis
          start={start}
          end={end}
          params={params}
          campaigns={campaigns}
          selectedCampaign={selectedCampaign}
          setSelectedCampaign={setSelectedCampaign}
        />
      )}
      {activeMetaTab === 'Funnel Analysis' && (
        <MetaFunnelAnalysis
          start={start}
          end={end}
          compareStart={compareStart}
          compareEnd={compareEnd}
          campaigns={campaigns}
          selectedCampaign={selectedCampaign}
          setSelectedCampaign={setSelectedCampaign}
        />
      )}
      {activeMetaTab === 'Alerts & Recommendations' && (
        <MetaAlerts start={start} end={end} compareStart={compareStart} compareEnd={compareEnd} params={params} />
      )}
    </section>
  );
}

function MetaOverview({ start, end, compareStart, compareEnd, params }: any) {
  const [payload, setPayload] = useState<any>(null);
  const [trend, setTrend] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [overviewRes, trendRes] = await Promise.all([
          fetch(`/api/meta-os?tab=overview&start=${start}&end=${end}&compareStart=${compareStart}&compareEnd=${compareEnd}`),
          fetch(`/api/meta-os?tab=trend&start=${start}&end=${end}`),
        ]);
        setPayload(await overviewRes.json());
        const trendJson = await trendRes.json();
        setTrend(Array.isArray(trendJson) ? trendJson : []);
      } catch (error) {
        console.error('Meta overview error', error);
        setPayload(null);
        setTrend([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [start, end, compareStart, compareEnd]);

  if (loading || !payload) return <LoadingCard text="Loading Meta overview..." />;

  const current = payload.current || {};
  const compare = payload.compare || {};
  const spend = Number(current.spend || 0);
  const revenue = Number(current.revenue || 0);
  const purchases = Number(current.purchases || 0);
  const impressions = Number(current.impressions || 0);
  const reach = Number(current.reach || 0);
  const clicks = Number(current.clicks || 0);
  const roas = safeDivide(revenue, spend);
  const cpa = safeDivide(spend, purchases);
  const ctr = safeDivide(clicks, impressions) * 100;
  const cpm = safeDivide(spend, impressions) * 1000;
  const frequency = safeDivide(impressions, reach);
  const compareRoas = safeDivide(compare.revenue, compare.spend);
  const compareCpa = safeDivide(compare.spend, compare.purchases);

  const funnelData = [
    { name: 'Clicks', value: Number(current.clicks || 0) },
    { name: 'LPV', value: Number(current.lpv || 0) },
    { name: 'ATC', value: Number(current.atc || 0) },
    { name: 'Checkout', value: Number(current.checkout || 0) },
    { name: 'Purchase', value: Number(current.purchases || 0) },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard title="Revenue" value={formatCurrency(revenue)} delta={pctChange(revenue, compare.revenue)} goodUp />
        <MetricCard title="Spend" value={formatCurrency(spend)} delta={pctChange(spend, compare.spend)} />
        <MetricCard
          title="ROAS"
          value={formatNumber(roas)}
          delta={pctChange(roas, compareRoas)}
          goodUp
          status={roas >= params.targetRoas ? 'Above target' : 'Below target'}
        />
        <MetricCard
          title="CPA"
          value={formatCurrency(cpa)}
          delta={pctChange(cpa, compareCpa)}
          status={cpa <= params.targetCpa ? 'Within target' : 'Above target'}
        />
        <MetricCard title="Purchases" value={formatNumber(purchases, 0)} delta={pctChange(purchases, compare.purchases)} goodUp />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <DataTile label="Reach" value={formatNumber(reach, 0)} />
        <DataTile label="CPM" value={formatCurrency(cpm)} />
        <DataTile label="Frequency" value={formatNumber(frequency)} />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <ChartPanel title="Revenue vs Spend">
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#64748b" />
                <YAxis tick={{ fontSize: 11 }} stroke="#64748b" />
                <Tooltip formatter={(v: any) => formatCurrency(Number(v || 0))} />
                <Area type="monotone" dataKey="revenue" stroke="#0f172a" fill="#0f172a" fillOpacity={0.12} strokeWidth={2} />
                <Area type="monotone" dataKey="spend" stroke="#2563eb" fill="#2563eb" fillOpacity={0.1} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartPanel>

        <ChartPanel title="ROAS Trend">
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#64748b" />
                <YAxis tick={{ fontSize: 11 }} stroke="#64748b" />
                <Tooltip />
                <Line type="monotone" dataKey="roas" stroke="#0f172a" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartPanel>

        <ChartPanel title="CPA Trend">
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#64748b" />
                <YAxis tick={{ fontSize: 11 }} stroke="#64748b" />
                <Tooltip formatter={(v: any) => formatCurrency(Number(v || 0))} />
                <Line type="monotone" dataKey="cpa" stroke="#dc2626" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartPanel>

        <ChartPanel title="Funnel Drop-off">
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#64748b" />
                <YAxis tick={{ fontSize: 11 }} stroke="#64748b" />
                <Tooltip />
                <Bar dataKey="value" fill="#0f172a" radius={[12, 12, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartPanel>
      </div>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Panel title="Cost Drivers">
          <DriverRow label="CPM" value={formatCurrency(cpm)} note="Auction cost pressure" />
          <DriverRow label="Frequency" value={formatNumber(frequency)} note={frequency > params.maxFrequency ? 'Fatigue risk' : 'Below fatigue threshold'} />
          <DriverRow label="Reach" value={formatNumber(reach, 0)} note="Audience coverage" />
        </Panel>
        <Panel title="Conversion Drivers">
          <DriverRow label="CTR" value={`${formatNumber(ctr)}%`} note={ctr < params.minCtr ? 'Creative signal weak' : 'Creative signal acceptable'} />
          <DriverRow label="CPA" value={formatCurrency(cpa)} note={cpa > params.maxCpa ? 'Above hard limit' : 'Within limit'} />
          <DriverRow label="ROAS" value={formatNumber(roas)} note={roas < params.minRoas ? 'Below floor' : 'Above floor'} />
        </Panel>
      </section>
    </div>
  );
}

function MetaSettings({ params, setParams }: any) {
  const update = (key: keyof MetaParams, value: string) => {
    setParams((prev: MetaParams) => ({ ...prev, [key]: Number(value || 0) }));
  };

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
      <SettingCard title="Core Targets">
        <SettingInput label="Target ROAS" value={params.targetRoas} onChange={(v: string) => update('targetRoas', v)} />
        <SettingInput label="Target CPA" value={params.targetCpa} onChange={(v: string) => update('targetCpa', v)} />
      </SettingCard>
      <SettingCard title="Decision Rules">
        <SettingInput label="Scale If Better Than Target %" value={params.scalePct} onChange={(v: string) => update('scalePct', v)} />
        <SettingInput label="Kill If Worse Than Target %" value={params.killPct} onChange={(v: string) => update('killPct', v)} />
      </SettingCard>
      <SettingCard title="Minimum Data Threshold">
        <SettingInput label="Minimum Spend To Evaluate" value={params.minSpend} onChange={(v: string) => update('minSpend', v)} />
        <SettingInput label="Minimum Purchases" value={params.minPurchases} onChange={(v: string) => update('minPurchases', v)} />
      </SettingCard>
      <SettingCard title="Efficiency Limits">
        <SettingInput label="Max CPA" value={params.maxCpa} onChange={(v: string) => update('maxCpa', v)} />
        <SettingInput label="Min ROAS" value={params.minRoas} onChange={(v: string) => update('minRoas', v)} />
      </SettingCard>
      <SettingCard title="Creative & Fatigue Signals">
        <SettingInput label="Min CTR %" value={params.minCtr} onChange={(v: string) => update('minCtr', v)} />
        <SettingInput label="Max Frequency" value={params.maxFrequency} onChange={(v: string) => update('maxFrequency', v)} />
        <SettingInput label="CPM Increase %" value={params.cpmIncreasePct} onChange={(v: string) => update('cpmIncreasePct', v)} />
      </SettingCard>
      <div className="rounded-[2rem] border border-slate-800 bg-gradient-to-br from-slate-950 to-slate-900 p-6 text-white shadow-2xl shadow-slate-900/25">
        <h3 className="text-lg font-black">How this powers Meta OS</h3>
        <p className="mt-2 text-sm text-slate-400">Every tab uses these rules to classify Scale, Test, Kill and Ignore.</p>
        <div className="mt-5 space-y-2 text-sm text-slate-300">
          <p>Scale ROAS: above {(params.targetRoas * (1 + params.scalePct / 100)).toFixed(2)}</p>
          <p>Kill ROAS: below {(params.targetRoas * (1 - params.killPct / 100)).toFixed(2)}</p>
          <p>Evaluate only after {formatCurrency(params.minSpend)} spend</p>
        </div>
      </div>
    </div>
  );
}

function MetaCampaignAnalysis({ start, end, params }: any) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/meta-os?tab=campaign&start=${start}&end=${end}`);
        const json = await res.json();
        setRows(Array.isArray(json) ? json : []);
      } catch (error) {
        console.error('Campaign analysis error', error);
        setRows([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [start, end]);

  if (loading) return <LoadingCard text="Loading campaigns..." />;

  const accountBenchmark = buildBenchmark(rows);

  const enriched = rows
    .map((campaign) => {
      const decisionData = getDecisionBucket(campaign, accountBenchmark, params);
      return {
        ...campaign,
        decision: decisionData.decision,
        reason: decisionData.reason,
        spendShare: safeDivide(campaign.spend, accountBenchmark.spend) * 100,
      };
    })
    .sort((a, b) => Number(b.spend || 0) - Number(a.spend || 0));

  const scale = enriched.filter((x) => x.decision === 'SCALE');
  const test = enriched.filter((x) => x.decision === 'TEST');
  const kill = enriched.filter((x) => x.decision === 'KILL');
  const ignore = enriched.filter((x) => x.decision === 'IGNORE');

  return (
    <div className="space-y-6">
      <Panel title="Campaign Decision Buckets">
        <p className="mb-5 text-sm font-semibold text-slate-600">
          Campaigns are benchmarked against overall Meta account performance for the selected date range.
        </p>
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-4">
          <DecisionBucket title="🟢 Scale" items={scale} />
          <DecisionBucket title="🟡 Test" items={test} />
          <DecisionBucket title="🔴 Kill / Fix" items={kill} />
          <DecisionBucket title="⚪ Ignore" items={ignore} />
        </div>
      </Panel>

      <section className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <ConcentrationCard title="Top Campaign Share" value={`${formatNumber(enriched[0]?.spendShare || 0)}%`} danger={(enriched[0]?.spendShare || 0) > 50} />
        <ConcentrationCard
          title="Top 3 Campaign Share"
          value={`${formatNumber(enriched.slice(0, 3).reduce((acc, row) => acc + Number(row.spendShare || 0), 0))}%`}
          danger={enriched.slice(0, 3).reduce((acc, row) => acc + Number(row.spendShare || 0), 0) > 80}
        />
        <ConcentrationCard title="Campaigns Evaluated" value={formatNumber(enriched.length, 0)} danger={false} />
      </section>

      <Panel title="Campaign Leaderboard">
        <div className="space-y-3">
          {enriched.map((campaign, i) => (
            <DecisionRow key={i} title={campaign.campaign_name || 'Unnamed campaign'} status={campaign.decision} subtitle={`${formatNumber(campaign.spendShare)}% spend share · ${campaign.reason}`}>
              <MiniStat label="Spend" value={formatCurrency(campaign.spend)} />
              <MiniStat label="Revenue" value={formatCurrency(campaign.revenue)} />
              <MiniStat label="ROAS" value={formatNumber(campaign.roas)} />
              <MiniStat label="CPA" value={formatCurrency(campaign.cpa)} />
              <MiniStat label="CTR" value={`${formatNumber(campaign.ctr)}%`} />
              <MiniStat label="Freq" value={formatNumber(campaign.frequency)} />
            </DecisionRow>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function MetaAdSetAnalysis({ start, end, params, campaigns, selectedCampaign, setSelectedCampaign }: any) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedCampaign) return;

    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/meta-os?tab=adset&start=${start}&end=${end}&campaign=${encodeURIComponent(selectedCampaign)}`);
        const json = await res.json();
        setRows(Array.isArray(json) ? json : []);
      } catch (error) {
        console.error('Ad set analysis error', error);
        setRows([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [start, end, selectedCampaign]);

  if (!selectedCampaign) return <EmptyState title="No campaign selected" text="Select a campaign to analyse ad sets." />;
  if (loading) return <LoadingCard text="Loading ad sets..." />;

  const parentBenchmark = {
    spend: Number(rows[0]?.campaign_spend || 0),
    revenue: Number(rows[0]?.campaign_revenue || 0),
    purchases: Number(rows[0]?.campaign_purchases || 0),
    roas: safeDivide(rows[0]?.campaign_revenue, rows[0]?.campaign_spend),
    cpa: safeDivide(rows[0]?.campaign_spend, rows[0]?.campaign_purchases),
    avgSpend: safeDivide(rows[0]?.campaign_spend, Math.max(rows.length, 1)),
  };

  const fallbackBenchmark = buildBenchmark(rows);
  const benchmark = parentBenchmark.spend ? parentBenchmark : fallbackBenchmark;

  const enriched = rows
    .map((adset) => {
      const decisionData = getDecisionBucket(adset, benchmark, params);
      return {
        ...adset,
        decision: decisionData.decision,
        reason: decisionData.reason,
      };
    })
    .sort((a, b) => Number(b.spend || 0) - Number(a.spend || 0));

  const scale = enriched.filter((x) => x.decision === 'SCALE');
  const test = enriched.filter((x) => x.decision === 'TEST');
  const kill = enriched.filter((x) => x.decision === 'KILL');
  const ignore = enriched.filter((x) => x.decision === 'IGNORE');

  return (
    <div className="space-y-6">
      <CampaignPicker campaigns={campaigns} value={selectedCampaign} onChange={setSelectedCampaign} />

      <Panel title="Ad Set Decision Buckets">
        <p className="mb-5 text-sm font-semibold text-slate-600">
          Ad sets are benchmarked against their parent campaign performance for the selected date range.
        </p>
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-4">
          <DecisionBucket title="🟢 Scale" items={scale} />
          <DecisionBucket title="🟡 Test" items={test} />
          <DecisionBucket title="🔴 Kill / Fix" items={kill} />
          <DecisionBucket title="⚪ Ignore" items={ignore} />
        </div>
      </Panel>

      <Panel title="Ad Set Leaderboard">
        <div className="space-y-3">
          {enriched.map((adset, i) => (
            <DecisionRow key={i} title={adset.adset_name || 'Unnamed ad set'} status={adset.decision} subtitle={`Spend share ${formatNumber(adset.spend_share)}% · ${adset.reason}`}>
              <MiniStat label="Spend" value={formatCurrency(adset.spend)} />
              <MiniStat label="Revenue" value={formatCurrency(adset.revenue)} />
              <MiniStat label="ROAS" value={formatNumber(adset.roas)} />
              <MiniStat label="CPA" value={formatCurrency(adset.cpa)} />
              <MiniStat label="Purchases" value={formatNumber(adset.purchases, 0)} />
              <MiniStat label="Freq" value={formatNumber(adset.frequency)} />
            </DecisionRow>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function MetaCreativeAnalysis({ start, end, params, campaigns, selectedCampaign, setSelectedCampaign }: any) {
  const [rows, setRows] = useState<any[]>([]);
  const [dailyRows, setDailyRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedCampaign) return;

    async function load() {
      setLoading(true);
      try {
        const [summaryRes, dailyRes] = await Promise.all([
          fetch(`/api/meta-os?tab=creative&start=${start}&end=${end}&campaign=${encodeURIComponent(selectedCampaign)}`),
          fetch(`/api/meta-os?tab=creative-daily-4pi&start=${start}&end=${end}&campaign=${encodeURIComponent(selectedCampaign)}`),
        ]);
        const summaryJson = await summaryRes.json();
        const dailyJson = await dailyRes.json();
        setRows(Array.isArray(summaryJson) ? summaryJson : []);
        setDailyRows(Array.isArray(dailyJson) ? dailyJson : []);
      } catch (error) {
        console.error('Creative analysis error', error);
        setRows([]);
        setDailyRows([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [start, end, selectedCampaign]);

  if (!selectedCampaign) return <EmptyState title="No campaign selected" text="Select a campaign to analyse creatives." />;
  if (loading) return <LoadingCard text="Loading creative analysis..." />;

  const baseline = rows[0] || {};
  const enriched = rows.map((creative) => ({ ...creative, status: classifyCreative(creative, params) }));
  const scale = enriched.filter((c) => c.status === 'SCALE');
  const test = enriched.filter((c) => c.status === 'TEST');
  const kill = enriched.filter((c) => c.status === 'KILL');
  const ignore = enriched.filter((c) => c.status === 'IGNORE');

  const groupedDaily = dailyRows.reduce((acc: any, row: any) => {
    const key = row.ad_id || row.creative_name || 'unknown';
    if (!acc[key]) acc[key] = [];
    acc[key].push(row);
    return acc;
  }, {});

  const fourPiCreatives = Object.values(groupedDaily).map((creativeRows: any) => buildCreative4PiSummary(creativeRows));
  const tofCreatives = fourPiCreatives.filter((c: any) => c.dominantStage === 'TOF');
  const mofCreatives = fourPiCreatives.filter((c: any) => c.dominantStage === 'MOF');
  const bofCreatives = fourPiCreatives.filter((c: any) => c.dominantStage === 'BOF');

  return (
    <div className="space-y-6">
      <CampaignPicker campaigns={campaigns} value={selectedCampaign} onChange={setSelectedCampaign} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <DataTile label="Campaign ROAS" value={formatNumber(baseline.campaign_roas)} />
        <DataTile label="Campaign CPA" value={formatCurrency(baseline.campaign_cpa)} />
        <DataTile label="Campaign CTR" value={`${formatNumber(baseline.campaign_ctr)}%`} />
        <DataTile label="Campaign CPM" value={formatCurrency(baseline.campaign_cpm)} />
        <DataTile label="Creatives" value={formatNumber(rows.length, 0)} />
      </div>

      <Panel title="Section 1: Daily 4PI Funnel Analysis">
        <p className="mb-5 text-sm font-semibold leading-6 text-slate-600">
          This analysis uses daily creative behavior only. Frequency defines TOF, MOF, BOF. CPM and CPA are compared against campaign average.
        </p>
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
          <FourPiFunnelBox title="TOF Creatives" subtitle="Frequency 1.00–1.15" items={tofCreatives} />
          <FourPiFunnelBox title="MOF Creatives" subtitle="Frequency 1.16–1.25" items={mofCreatives} />
          <FourPiFunnelBox title="BOF Creatives" subtitle="Frequency 1.26+" items={bofCreatives} />
        </div>
      </Panel>

      <Panel title="Section 2: Creative Decision Buckets">
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <CreativeBucket title="🟢 Scale" subtitle="Meaningful spend + above campaign average" items={scale} />
          <CreativeBucket title="🟡 Test" subtitle="Low spend but promising signal" items={test} />
          <CreativeBucket title="🔴 Kill / Fix" subtitle="Meaningful spend + below campaign average" items={kill} />
          <CreativeBucket title="⚪ Ignore" subtitle="Low signal / no action yet" items={ignore} />
        </div>
      </Panel>

      <Panel title="Section 3: Creative Leaderboard">
        <div className="space-y-3">
          {enriched
            .sort((a, b) => Number(b.roas_index || 0) - Number(a.roas_index || 0))
            .map((creative, i) => (
              <DecisionRow key={i} title={creative.creative_name || 'Unnamed creative'} status={creative.status} subtitle={`ROAS Index ${formatNumber(creative.roas_index)} · CTR Index ${formatNumber(creative.ctr_index)}`}>
                <MiniStat label="Spend" value={formatCurrency(creative.spend)} />
                <MiniStat label="Revenue" value={formatCurrency(creative.revenue)} />
                <MiniStat label="ROAS" value={`${formatNumber(creative.roas)} (${formatIndex(creative.roas_index)})`} />
                <MiniStat label="CTR" value={`${formatNumber(creative.ctr)}% (${formatIndex(creative.ctr_index)})`} />
                <MiniStat label="CPA" value={formatCurrency(creative.cpa)} />
                <MiniStat label="Purchases" value={formatNumber(creative.purchases, 0)} />
              </DecisionRow>
            ))}
        </div>
      </Panel>
    </div>
  );
}

function MetaFunnelAnalysis({ start, end, compareStart, compareEnd, campaigns, selectedCampaign, setSelectedCampaign }: any) {
  const [viewMode, setViewMode] = useState<'account' | 'campaign'>('account');
  const [payload, setPayload] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const campaignParam = viewMode === 'campaign' && selectedCampaign ? `&campaign=${encodeURIComponent(selectedCampaign)}` : '';
        const res = await fetch(`/api/meta-os?tab=funnel&start=${start}&end=${end}&compareStart=${compareStart}&compareEnd=${compareEnd}${campaignParam}`);
        setPayload(await res.json());
      } catch (error) {
        console.error('Funnel error', error);
        setPayload(null);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [start, end, compareStart, compareEnd, viewMode, selectedCampaign]);

  if (loading || !payload) return <LoadingCard text="Loading funnel..." />;

  const data = payload.current || {};
  const compare = payload.compare || {};
  const rates = getFunnelRates(data);
  const prevRates = getFunnelRates(compare);
  const deltas = {
    ctr: rates.ctr - prevRates.ctr,
    lpv: rates.lpvRate - prevRates.lpvRate,
    atc: rates.atcRate - prevRates.atcRate,
    checkout: rates.checkoutRate - prevRates.checkoutRate,
    purchase: rates.purchaseRate - prevRates.purchaseRate,
  };
  const biggestDrop = Object.entries(deltas).sort((a, b) => a[1] - b[1])[0] || ['none', 0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl border bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-black">Funnel Analysis</h3>
          <p className="text-sm text-slate-500">Account-level health or campaign-level diagnosis.</p>
        </div>
        <div className="flex gap-2">
          <Toggle active={viewMode === 'account'} onClick={() => setViewMode('account')} label="Account Level" />
          <Toggle active={viewMode === 'campaign'} onClick={() => setViewMode('campaign')} label="Campaign Level" />
        </div>
      </div>

      {viewMode === 'campaign' && <CampaignPicker campaigns={campaigns} value={selectedCampaign} onChange={setSelectedCampaign} />}

      <Panel title="Funnel Flow">
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr_auto_1fr_auto_1fr] xl:items-center">
          <FunnelCard label="Impressions" value={data.impressions} />
          <Arrow />
          <FunnelCard label="Clicks" value={data.clicks} rate={rates.ctr} delta={deltas.ctr} rateLabel="CTR" />
          <Arrow />
          <FunnelCard label="LPV" value={data.lpv} rate={rates.lpvRate} delta={deltas.lpv} rateLabel="LPV Rate" />
          <Arrow />
          <FunnelCard label="ATC" value={data.atc} rate={rates.atcRate} delta={deltas.atc} rateLabel="ATC Rate" />
          <Arrow />
          <FunnelCard label="Checkout" value={data.checkout} rate={rates.checkoutRate} delta={deltas.checkout} rateLabel="Checkout Rate" />
          <Arrow />
          <FunnelCard label="Purchase" value={data.purchases} rate={rates.purchaseRate} delta={deltas.purchase} rateLabel="Purchase Rate" />
        </div>
      </Panel>

      <AlertBox tone="red" title="Biggest Drop-Off" text={`${String(biggestDrop[0]).toUpperCase()} changed ${biggestDrop[1] >= 0 ? '+' : ''}${formatNumber(biggestDrop[1])} pts vs compare.`} />
    </div>
  );
}

function MetaAlerts({ start, end, compareStart, compareEnd, params }: any) {
  const [campaignRows, setCampaignRows] = useState<any[]>([]);
  const [overview, setOverview] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [campaignRes, overviewRes] = await Promise.all([
          fetch(`/api/meta-os?tab=campaign&start=${start}&end=${end}`),
          fetch(`/api/meta-os?tab=overview&start=${start}&end=${end}&compareStart=${compareStart}&compareEnd=${compareEnd}`),
        ]);
        setCampaignRows(await campaignRes.json());
        setOverview(await overviewRes.json());
      } catch (error) {
        console.error('Alerts error', error);
        setCampaignRows([]);
        setOverview(null);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [start, end, compareStart, compareEnd]);

  if (loading || !overview) return <LoadingCard text="Loading recommendations..." />;

  const current = overview.current || {};
  const roas = safeDivide(current.revenue, current.spend);
  const cpa = safeDivide(current.spend, current.purchases);
  const frequency = safeDivide(current.impressions, current.reach);
  const totalSpend = sum(campaignRows, 'spend');
  const topCampaign = [...campaignRows].sort((a, b) => Number(b.spend || 0) - Number(a.spend || 0))[0];
  const topShare = safeDivide(topCampaign?.spend, totalSpend) * 100;

  const alerts = [
    roas < params.targetRoas && { tone: 'red', title: 'ROAS below target', text: `Meta ROAS is ${formatNumber(roas)} vs target ${params.targetRoas}.` },
    cpa > params.maxCpa && { tone: 'red', title: 'CPA above hard limit', text: `CPA is ${formatCurrency(cpa)} vs max ${formatCurrency(params.maxCpa)}.` },
    frequency > params.maxFrequency && { tone: 'amber', title: 'Frequency fatigue risk', text: `Frequency is ${formatNumber(frequency)} vs threshold ${params.maxFrequency}.` },
    topShare > 50 && { tone: 'amber', title: 'Campaign dependency risk', text: `${topCampaign?.campaign_name} controls ${formatNumber(topShare)}% of spend.` },
    roas >= params.targetRoas && cpa <= params.maxCpa && { tone: 'green', title: 'Meta within operating range', text: 'ROAS and CPA are within current Settings thresholds.' },
  ].filter(Boolean) as any[];

  return <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">{alerts.map((alert, i) => <AlertBox key={i} tone={alert.tone} title={alert.title} text={alert.text} />)}</div>;
}

function classifyCreative(c: any, params: MetaParams) {
  const spend = Number(c.spend || 0);
  const purchases = Number(c.purchases || 0);
  const roasIndex = Number(c.roas_index || 0);
  const ctrIndex = Number(c.ctr_index || 0);
  const highIndex = 1 + params.scalePct / 100;
  const lowIndex = 1 - params.killPct / 100;

  if (spend >= params.minSpend && purchases >= params.minPurchases && roasIndex >= highIndex) return 'SCALE';
  if (spend < params.minSpend && (roasIndex >= highIndex || ctrIndex >= highIndex)) return 'TEST';
  if (spend >= params.minSpend && roasIndex <= lowIndex) return 'KILL';
  return 'IGNORE';
}

function buildBenchmark(rows: any[]) {
  const spend = sum(rows, 'spend');
  const revenue = sum(rows, 'revenue');
  const purchases = sum(rows, 'purchases');
  const impressions = sum(rows, 'impressions');
  const clicks = sum(rows, 'clicks');
  const reach = sum(rows, 'reach');

  return {
    spend,
    revenue,
    purchases,
    impressions,
    clicks,
    reach,
    roas: safeDivide(revenue, spend),
    cpa: safeDivide(spend, purchases),
    ctr: safeDivide(clicks, impressions) * 100,
    frequency: safeDivide(impressions, reach),
    avgSpend: safeDivide(spend, Math.max(rows.length, 1)),
  };
}

function getDecisionBucket(row: any, benchmark: any, params: MetaParams) {
  const spend = Number(row.spend || 0);
  const roas = Number(row.roas || 0);
  const cpa = Number(row.cpa || 0);
  const purchases = Number(row.purchases || 0);
  const hasEnoughData = spend >= params.minSpend && purchases >= params.minPurchases;
  const roasIndex = safeDivide(roas, benchmark.roas);
  const cpaIndex = safeDivide(cpa, benchmark.cpa);
  const spendIndex = safeDivide(spend, benchmark.avgSpend || benchmark.spend);

  if (!hasEnoughData) {
    if (roasIndex >= 1.1 || cpaIndex <= 0.9) {
      return { decision: 'TEST', reason: 'Low data, but early efficiency is better than benchmark' };
    }
    return { decision: 'IGNORE', reason: 'Low signal / not enough spend or purchases yet' };
  }

  if (roasIndex >= 1.1 && cpaIndex <= 0.9) {
    return { decision: 'SCALE', reason: 'ROAS better than benchmark and CPA lower than benchmark' };
  }

  if (roasIndex <= 0.85 && cpaIndex >= 1.15) {
    return { decision: 'KILL', reason: 'ROAS below benchmark and CPA above benchmark' };
  }

  if (spendIndex < 0.7 && (roasIndex >= 1 || cpaIndex <= 1)) {
    return { decision: 'TEST', reason: 'Under-spent but performance is near or better than benchmark' };
  }

  return { decision: 'IGNORE', reason: 'Average performance; no clear scale or kill signal' };
}

function getFunnelRates(data: any) {
  return {
    ctr: safeDivide(data.clicks, data.impressions) * 100,
    lpvRate: safeDivide(data.lpv, data.clicks) * 100,
    atcRate: safeDivide(data.atc, data.lpv) * 100,
    checkoutRate: safeDivide(data.checkout, data.atc) * 100,
    purchaseRate: safeDivide(data.purchases, data.checkout) * 100,
  };
}

function getDailyFunnelStage(frequency: number) {
  if (frequency <= 1.15) return 'TOF';
  if (frequency <= 1.25) return 'MOF';
  return 'BOF';
}

function getIndexBucket(value: number, benchmark: number) {
  if (!benchmark) return 'Moderate';
  const index = Number(value || 0) / Number(benchmark || 0);
  if (index < 0.9) return 'Low';
  if (index > 1.1) return 'High';
  return 'Moderate';
}

function getDailyEfficiencyBucket(cpa: number, campaignCpa: number) {
  if (!cpa || !campaignCpa) return 'Unknown';
  const index = cpa / campaignCpa;
  if (index < 0.9) return 'Low CPA';
  if (index > 1.1) return 'High CPA';
  return 'Moderate CPA';
}

function getDaily4PiStrength(stage: string, spendBucket: string, cpmBucket: string, cpaBucket: string) {
  if (stage === 'TOF') {
    if (spendBucket === 'High' && cpmBucket === 'Low' && cpaBucket === 'Low CPA') return 'Strong';
    if (cpmBucket === 'High' || cpaBucket === 'High CPA') return 'Weak';
    return 'Medium';
  }
  if (stage === 'MOF') {
    if (spendBucket !== 'Low' && cpmBucket !== 'High' && cpaBucket !== 'High CPA') return 'Strong';
    if (cpmBucket === 'High' && cpaBucket === 'High CPA') return 'Weak';
    return 'Medium';
  }
  if (stage === 'BOF') {
    if (cpaBucket === 'Low CPA') return 'Strong';
    if (cpaBucket === 'High CPA' && cpmBucket === 'High') return 'Weak';
    return 'Medium';
  }
  return 'Medium';
}

function buildCreative4PiSummary(rows: any[]) {
  const totalSpend = rows.reduce((acc, row) => acc + Number(row.spend || 0), 0);
  const avgCpm = rows.reduce((acc, row) => acc + Number(row.cpm || 0), 0) / Math.max(rows.length, 1);
  const avgCpa = rows.reduce((acc, row) => acc + Number(row.cpa || 0), 0) / Math.max(rows.length, 1);
  const avgDailySpend = totalSpend / Math.max(rows.length, 1);

  const daily = rows.map((row) => {
    const frequency = Number(row.frequency || 0);
    const spend = Number(row.spend || 0);
    const cpm = Number(row.cpm || 0);
    const campaignCpm = Number(row.campaign_cpm || 0);
    const cpa = Number(row.cpa || 0);
    const campaignCpa = Number(row.campaign_cpa || 0);
    const stage = getDailyFunnelStage(frequency);
    const spendBucket = getIndexBucket(spend, avgDailySpend);
    const cpmBucket = getIndexBucket(cpm, campaignCpm);
    const cpaBucket = getDailyEfficiencyBucket(cpa, campaignCpa);
    const strength = getDaily4PiStrength(stage, spendBucket, cpmBucket, cpaBucket);
    return { ...row, stage, spendBucket, cpmBucket, cpaBucket, strength };
  });

  const count = (key: string, value: string) => daily.filter((row) => row[key] === value).length;
  const tofDays = count('stage', 'TOF');
  const mofDays = count('stage', 'MOF');
  const bofDays = count('stage', 'BOF');

  let dominantStage = 'TOF';
  if (mofDays >= tofDays && mofDays >= bofDays) dominantStage = 'MOF';
  if (bofDays >= tofDays && bofDays >= mofDays) dominantStage = 'BOF';

  const stageRows = daily.filter((row) => row.stage === dominantStage);
  const strongDays = stageRows.filter((row) => row.strength === 'Strong').length;
  const mediumDays = stageRows.filter((row) => row.strength === 'Medium').length;
  const weakDays = stageRows.filter((row) => row.strength === 'Weak').length;

  let overallStrength = 'Medium';
  if (strongDays >= mediumDays && strongDays >= weakDays) overallStrength = 'Strong';
  if (weakDays >= strongDays && weakDays >= mediumDays) overallStrength = 'Weak';

  let recommendation = 'Watch';
  if (dominantStage === 'TOF' && overallStrength === 'Strong') recommendation = 'Scale reach';
  if (dominantStage === 'TOF' && overallStrength === 'Medium') recommendation = 'Maintain reach';
  if (dominantStage === 'TOF' && overallStrength === 'Weak') recommendation = 'Fix hook / relevance';
  if (dominantStage === 'MOF' && overallStrength === 'Strong') recommendation = 'Scale carefully';
  if (dominantStage === 'MOF' && overallStrength === 'Medium') recommendation = 'Maintain';
  if (dominantStage === 'MOF' && overallStrength === 'Weak') recommendation = 'Improve messaging';
  if (dominantStage === 'BOF' && overallStrength === 'Strong') recommendation = 'Scale';
  if (dominantStage === 'BOF' && overallStrength === 'Medium') recommendation = 'Evaluate via CPA';
  if (dominantStage === 'BOF' && overallStrength === 'Weak') recommendation = 'Replace';

  return {
    ad_id: rows[0]?.ad_id || '',
    creative_name: rows[0]?.creative_name || 'Unnamed creative',
    dominantStage,
    overallStrength,
    recommendation,
    tofDays,
    mofDays,
    bofDays,
    strongDays,
    mediumDays,
    weakDays,
    totalSpend,
    avgCpm,
    avgCpa,
    daily,
  };
}

function formatCurrency(value: number = 0) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(value || 0));
}

function formatNumber(value: number = 0, digits = 2) {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: digits }).format(Number(value || 0));
}

function pctChange(current: number, previous: number) {
  if (!previous || previous === 0) return 0;
  return ((Number(current || 0) - Number(previous || 0)) / Number(previous || 0)) * 100;
}

function safeDivide(a: any, b: any) {
  const numerator = Number(a || 0);
  const denominator = Number(b || 0);
  if (!denominator) return 0;
  return numerator / denominator;
}

function sum(rows: Row[], key: string) {
  return rows.reduce((acc, row) => acc + Number(row[key] || 0), 0);
}

function formatIndex(index: number) {
  const change = (Number(index || 0) - 1) * 100;
  return `${change >= 0 ? '+' : ''}${change.toFixed(0)}% vs avg`;
}

function LoadingCard({ text }: any) {
  return <div className="rounded-[2rem] border border-slate-200 bg-white p-6 font-bold text-slate-500 shadow-xl shadow-slate-200/60">{text}</div>;
}

function EmptyState({ title, text }: any) {
  return (
    <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white/80 p-10 shadow-xl shadow-slate-200/70">
      <h3 className="text-xl font-black">{title}</h3>
      <p className="mt-2 text-slate-500">{text}</p>
    </div>
  );
}

function Panel({ title, children }: any) {
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60">
      <h3 className="mb-4 text-lg font-black tracking-tight">{title}</h3>
      {children}
    </section>
  );
}

function ChartPanel({ title, children }: any) {
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/60">
      <h3 className="mb-4 text-sm font-black uppercase tracking-[0.16em] text-slate-500">{title}</h3>
      {children}
    </section>
  );
}

function MetricCard({ title, value, delta, goodUp = false, status }: any) {
  const isGood = goodUp ? delta >= 0 : delta <= 0;
  return (
    <div className="group relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/60 transition hover:-translate-y-1">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-400 via-blue-600 to-emerald-400" />
      <p className="text-xs font-black uppercase tracking-wider text-slate-500">{title}</p>
      <h3 className="mt-2 text-2xl font-black tracking-tight">{value}</h3>
      <div className="mt-3 flex items-center justify-between gap-2">
        <p className={isGood ? 'text-sm font-black text-emerald-600' : 'text-sm font-black text-red-600'}>
          {delta >= 0 ? '▲' : '▼'} {Math.abs(delta || 0).toFixed(2)}%
        </p>
        {status && <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">{status}</span>}
      </div>
    </div>
  );
}

function DataTile({ label, value }: any) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-black tracking-tight">{value}</p>
    </div>
  );
}

function DriverRow({ label, value, note }: any) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 py-4 last:border-0">
      <div>
        <p className="font-black">{label}</p>
        <p className="text-sm text-slate-500">{note}</p>
      </div>
      <strong className="text-lg">{value}</strong>
    </div>
  );
}

function MiniStat({ label, value }: any) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className="mt-1 font-black">{value}</p>
    </div>
  );
}

function DecisionRow({ title, subtitle, status, children }: any) {
  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4 shadow-lg shadow-slate-200/60">
      <div className="mb-3 flex items-start justify-between gap-4">
        <div>
          <h4 className="font-black">{title}</h4>
          <p className="text-sm font-semibold text-slate-500">{subtitle}</p>
        </div>
        <StatusBadge status={status} />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6">{children}</div>
    </div>
  );
}

function StatusBadge({ status }: any) {
  const cls =
    status === 'SCALE'
      ? 'bg-emerald-100 text-emerald-700'
      : status === 'KILL'
        ? 'bg-red-100 text-red-700'
        : status === 'TEST'
          ? 'bg-blue-100 text-blue-700'
          : 'bg-slate-200 text-slate-600';
  return <span className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-black ${cls}`}>{status}</span>;
}

function DecisionBucket({ title, items }: any) {
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-black">{title}</h3>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-600">{items.length}</span>
      </div>
      {items.length === 0 ? (
        <p className="text-sm font-semibold text-slate-500">No items</p>
      ) : (
        <div className="space-y-3">
          {items.slice(0, 8).map((item: any, i: number) => (
            <div key={i} className="rounded-2xl border bg-white p-4">
              <p className="font-black">{item.campaign_name || item.adset_name || 'Unnamed'}</p>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                Spend {formatCurrency(item.spend)} · ROAS {formatNumber(item.roas)} · CPA {formatCurrency(item.cpa)}
              </p>
              <p className="mt-2 text-sm font-bold text-slate-700">{item.reason}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CreativeBucket({ title, subtitle, items }: any) {
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60">
      <h3 className="font-black">{title}</h3>
      <p className="mb-4 text-sm text-slate-500">{subtitle}</p>
      {items.length === 0 && <p className="text-sm text-slate-500">No creatives in this bucket.</p>}
      <div className="space-y-3">
        {items.slice(0, 5).map((c: any, i: number) => (
          <div key={i} className="rounded-2xl border bg-slate-50 p-4">
            <p className="font-black">{c.creative_name}</p>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Spend {formatCurrency(c.spend)} · ROAS {formatNumber(c.roas)} · Index {formatNumber(c.roas_index)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function FourPiFunnelBox({ title, subtitle, items }: any) {
  const strong = items.filter((x: any) => x.overallStrength === 'Strong');
  const medium = items.filter((x: any) => x.overallStrength === 'Medium');
  const weak = items.filter((x: any) => x.overallStrength === 'Weak');

  return (
    <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-5">
      <div className="mb-5">
        <h3 className="text-lg font-black text-slate-950">{title}</h3>
        <p className="text-sm font-semibold text-slate-500">{subtitle}</p>
      </div>
      <FourPiStrengthGroup title="Strong" items={strong} />
      <FourPiStrengthGroup title="Medium" items={medium} />
      <FourPiStrengthGroup title="Weak" items={weak} />
    </div>
  );
}

function FourPiStrengthGroup({ title, items }: any) {
  const tone = title === 'Strong' ? 'border-emerald-200 bg-emerald-50' : title === 'Weak' ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50';
  return (
    <div className={`mb-4 rounded-2xl border p-4 ${tone}`}>
      <div className="mb-3 flex items-center justify-between">
        <h4 className="font-black text-slate-950">{title}</h4>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-600">{items.length}</span>
      </div>
      {items.length === 0 ? (
        <p className="text-sm font-semibold text-slate-500">No creatives</p>
      ) : (
        <div className="space-y-3">
          {items.map((creative: any, i: number) => (
            <div key={i} className="rounded-xl border border-white/70 bg-white p-3">
              <p className="font-black text-slate-950">{creative.creative_name}</p>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                TOF {creative.tofDays}d · MOF {creative.mofDays}d · BOF {creative.bofDays}d
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                Spend {formatCurrency(creative.totalSpend)} · Avg CPM {formatCurrency(creative.avgCpm)} · Avg CPA {formatCurrency(creative.avgCpa)}
              </p>
              <p className="mt-2 text-sm font-bold text-slate-700">{creative.recommendation}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CampaignPicker({ campaigns, value, onChange }: any) {
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/60">
      <label className="block text-xs font-black uppercase tracking-wider text-slate-500">Campaign</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="mt-2 w-full rounded-2xl border bg-slate-50 px-4 py-3 font-bold outline-none">
        {campaigns.map((campaign: string) => (
          <option key={campaign} value={campaign}>
            {campaign}
          </option>
        ))}
      </select>
    </div>
  );
}

function SettingCard({ title, children }: any) {
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-6 shadow-lg shadow-slate-200/60">
      <h3 className="mb-4 font-black">{title}</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function SettingInput({ label, value, onChange }: any) {
  return (
    <label>
      <span className="mb-1 block text-xs font-bold text-slate-500">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-black outline-none focus:border-slate-950" />
    </label>
  );
}

function ConcentrationCard({ title, value, danger }: any) {
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/60">
      <p className="text-sm font-bold text-slate-500">{title}</p>
      <p className="mt-1 text-3xl font-black tracking-tight">{value}</p>
      <p className={danger ? 'mt-2 text-xs font-black text-red-600' : 'mt-2 text-xs font-black text-emerald-600'}>{danger ? 'High Risk' : 'Healthy'}</p>
    </div>
  );
}

function AlertBox({ tone, title, text }: any) {
  const cls = tone === 'red' ? 'border-red-200 bg-red-50 text-red-900' : tone === 'amber' ? 'border-amber-200 bg-amber-50 text-amber-900' : 'border-emerald-200 bg-emerald-50 text-emerald-900';
  return (
    <div className={`rounded-2xl border p-4 ${cls}`}>
      <h4 className="font-black">{title}</h4>
      <p className="mt-1 text-sm opacity-80">{text}</p>
    </div>
  );
}

function FunnelCard({ label, value, rate, delta, rateLabel }: any) {
  return (
    <div className="rounded-2xl border bg-slate-50 p-4 text-center">
      <p className="text-xs font-black uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-black">{formatNumber(value, 0)}</p>
      {rate !== undefined && (
        <p className="mt-1 text-sm font-bold">
          {rateLabel}: {formatNumber(rate)}% <span className={delta < 0 ? 'text-red-600' : 'text-emerald-600'}>{delta >= 0 ? '▲' : '▼'} {Math.abs(delta || 0).toFixed(1)}</span>
        </p>
      )}
    </div>
  );
}

function Arrow() {
  return <div className="hidden text-center text-2xl font-black text-slate-300 xl:block">→</div>;
}

function Toggle({ active, onClick, label }: any) {
  return <button onClick={onClick} className={active ? 'rounded-full bg-slate-950 px-4 py-2 text-sm font-black text-white' : 'rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-slate-600'}>{label}</button>;
}