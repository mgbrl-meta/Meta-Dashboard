'use client';

import { useEffect, useState } from 'react';

type Props = {
  startDate?: string;
  endDate?: string;
};

const money = (v: number) => `₹${Math.round(v || 0).toLocaleString()}`;
const pct = (v: number) => `${((v || 0) * 100).toFixed(1)}%`;

export default function GoogleChannelMix({ startDate, endDate }: Props) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!startDate || !endDate) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `/api/google-os/channel-mix?start=${startDate}&end=${endDate}`
        );
        const json = await res.json();
        setData(json);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [startDate, endDate]);

  if (loading) {
    return (
      <div className="rounded-3xl border bg-white/90 p-10 text-center">
        Loading Channel Mix...
      </div>
    );
  }

  const channels = data?.channels || [];

  const reduceChannels = channels.filter((c: any) => c.action === 'REDUCE');
  const scaleChannels = channels.filter((c: any) => c.action === 'SCALE');

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <SummaryCard
          title="Total Spend"
          value={money(data?.totals?.spend || 0)}
          text="Google budget consumed in selected period"
        />
        <SummaryCard
          title="Scale Channels"
          value={scaleChannels.length}
          text="Channels earning more revenue share than spend share"
        />
        <SummaryCard
          title="Reduce Channels"
          value={reduceChannels.length}
          text="Channels consuming budget with weak efficiency"
        />
      </div>

      <div className="rounded-3xl border bg-white/90 p-6 shadow-sm">
        <h3 className="mb-1 text-xl font-black">Budget Reallocation Signal</h3>
        <p className="mb-4 text-sm text-slate-500">
          This tells where Google budget should move based on ROAS and efficiency gap.
        </p>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-2xl border bg-red-50 p-4">
            <p className="text-xs font-black uppercase text-red-700">
              Reduce From
            </p>
            <div className="mt-3 space-y-2">
              {reduceChannels.length === 0 && (
                <p className="text-sm text-slate-500">No clear reduction signal.</p>
              )}
              {reduceChannels.map((c: any) => (
                <div key={c.channel_type} className="flex justify-between text-sm">
                  <span className="font-bold">{c.channel_type}</span>
                  <span className="font-black text-red-700">
                    {money(Math.abs(c.suggested_budget_shift))}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border bg-emerald-50 p-4">
            <p className="text-xs font-black uppercase text-emerald-700">
              Move To
            </p>
            <div className="mt-3 space-y-2">
              {scaleChannels.length === 0 && (
                <p className="text-sm text-slate-500">No clear scale signal.</p>
              )}
              {scaleChannels.map((c: any) => (
                <div key={c.channel_type} className="flex justify-between text-sm">
                  <span className="font-bold">{c.channel_type}</span>
                  <span className="font-black text-emerald-700">
                    +{money(c.suggested_budget_shift)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border bg-white/90 p-6 shadow-sm">
        <h3 className="mb-1 text-xl font-black">Channel Scorecard</h3>
        <p className="mb-4 text-sm text-slate-500">
          Spend share vs revenue share shows whether each channel is over-funded or under-funded.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] border-collapse text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="py-3 pr-4">Channel</th>
                <th className="py-3 pr-4 text-right">Spend</th>
                <th className="py-3 pr-4 text-right">Revenue</th>
                <th className="py-3 pr-4 text-right">ROAS</th>
                <th className="py-3 pr-4 text-right">CPA</th>
                <th className="py-3 pr-4 text-right">Conv.</th>
                <th className="py-3 pr-4 text-right">Spend %</th>
                <th className="py-3 pr-4 text-right">Revenue %</th>
                <th className="py-3 pr-4 text-right">Gap</th>
                <th className="py-3 text-right">Action</th>
              </tr>
            </thead>

            <tbody>
              {channels.map((c: any) => (
                <tr key={c.channel_type} className="border-b last:border-0">
                  <td className="py-3 pr-4 font-black">{c.channel_type}</td>
                  <td className="py-3 pr-4 text-right">{money(c.spend)}</td>
                  <td className="py-3 pr-4 text-right">{money(c.revenue)}</td>
                  <td className="py-3 pr-4 text-right font-bold">
                    {c.roas?.toFixed(2)}
                  </td>
                  <td className="py-3 pr-4 text-right">{money(c.cpa)}</td>
                  <td className="py-3 pr-4 text-right">
                    {c.conversions?.toFixed(1)}
                  </td>
                  <td className="py-3 pr-4 text-right">{pct(c.spend_share)}</td>
                  <td className="py-3 pr-4 text-right">{pct(c.revenue_share)}</td>
                  <td
                    className={`py-3 pr-4 text-right font-black ${
                      c.efficiency_gap >= 0
                        ? 'text-emerald-700'
                        : 'text-red-700'
                    }`}
                  >
                    {pct(c.efficiency_gap)}
                  </td>
                  <td className={`py-3 text-right font-black ${actionColor(c.action)}`}>
                    {actionLabel(c.action)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-3xl border bg-white/90 p-6 shadow-sm">
        <h3 className="mb-3 text-xl font-black">Channel Diagnostics</h3>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {channels.map((c: any) => (
            <div key={c.channel_type} className="rounded-2xl border bg-slate-50 p-4">
              <p className="font-black">{c.channel_type}</p>
              <p className="mt-2 text-sm text-slate-600">
                {diagnostic(c)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ title, value, text }: any) {
  return (
    <div className="rounded-3xl border bg-white/90 p-5 shadow-sm">
      <p className="text-xs font-black uppercase text-slate-500">{title}</p>
      <p className="mt-1 text-2xl font-black">{value}</p>
      <p className="mt-2 text-sm text-slate-500">{text}</p>
    </div>
  );
}

function actionColor(action: string) {
  if (action === 'SCALE') return 'text-emerald-700';
  if (action === 'REDUCE') return 'text-red-700';
  if (action === 'WATCH') return 'text-amber-700';
  return 'text-slate-600';
}

function actionLabel(action: string) {
  if (action === 'SCALE') return 'Scale';
  if (action === 'REDUCE') return 'Reduce';
  if (action === 'HOLD_EFFICIENT') return 'Hold Efficient';
  return 'Watch';
}

function diagnostic(c: any) {
  if (c.action === 'SCALE') {
    return 'Revenue share is stronger than spend share. This channel may be under-funded.';
  }

  if (c.action === 'REDUCE') {
    return 'Spend share is higher than revenue share. This channel may be over-funded.';
  }

  if (c.channel_type === 'PERFORMANCE_MAX') {
    return 'PMax should be judged by ROAS, CPA and scale consistency because visibility is limited.';
  }

  if (c.channel_type === 'SEARCH') {
    return 'Search usually captures high intent. If efficient, protect budget and expand keyword coverage.';
  }

  return 'Monitor efficiency before changing budget.';
}