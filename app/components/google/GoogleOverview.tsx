'use client';

import { useEffect, useState } from 'react';

type Props = {
  startDate?: string;
  endDate?: string;
};

const money = (v: number) => `₹${Math.round(v || 0).toLocaleString()}`;
const pct = (v: number) => `${((v || 0) * 100).toFixed(1)}%`;

export default function GoogleOverview({ startDate, endDate }: Props) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!startDate || !endDate) {
        console.log('Missing overview dates:', startDate, endDate);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const res = await fetch(
          `/api/google-os/overview?start=${startDate}&end=${endDate}`
        );

        const json = await res.json();

        console.log('Google Overview response:', json);

        setData(json);
      } catch (err) {
        console.error('Overview fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [startDate, endDate]);

  if (loading) {
    return (
      <div className="rounded-3xl border bg-white/90 p-10 text-center">
        Loading Overview...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-3xl border bg-white/90 p-10 text-center text-slate-500">
        No overview data found.
      </div>
    );
  }

  const totals = data?.totals || {};
  const channelMix = data?.channel_mix || [];
  const campaigns = data?.campaigns || [];

  return (
    <div className="space-y-6">
      {/* NORTH STAR */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Card title="Spend" value={money(totals.spend)} />
        <Card title="Revenue" value={money(totals.revenue)} />
        <Card title="ROAS" value={totals.roas?.toFixed(2)} />
        <Card title="CPA" value={money(totals.cpa)} />
        <Card title="Conversions" value={totals.conversions?.toFixed(1)} />
        <Card title="RPC" value={money(totals.rpc)} />
      </div>

      {/* CHANNEL MIX */}
      <div className="rounded-3xl border bg-white/90 p-6 shadow-sm">
        <h3 className="mb-4 text-xl font-black">Channel Mix</h3>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="py-3 pr-4">Channel</th>
                <th className="py-3 pr-4 text-right">Spend</th>
                <th className="py-3 pr-4 text-right">Revenue</th>
                <th className="py-3 pr-4 text-right">ROAS</th>
                <th className="py-3 pr-4 text-right">CPA</th>
                <th className="py-3 pr-4 text-right">Spend %</th>
                <th className="py-3 pr-4 text-right">Revenue %</th>
                <th className="py-3 text-right">Gap</th>
              </tr>
            </thead>

            <tbody>
              {channelMix.map((c: any, i: number) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="py-3 pr-4 font-black">{c.channel_type}</td>
                  <td className="py-3 pr-4 text-right">{money(c.spend)}</td>
                  <td className="py-3 pr-4 text-right">{money(c.revenue)}</td>
                  <td className="py-3 pr-4 text-right font-bold">
                    {c.roas?.toFixed(2)}
                  </td>
                  <td className="py-3 pr-4 text-right">{money(c.cpa)}</td>
                  <td className="py-3 pr-4 text-right">
                    {pct(c.spend_share)}
                  </td>
                  <td className="py-3 pr-4 text-right">
                    {pct(c.revenue_share)}
                  </td>
                  <td
                    className={`py-3 text-right font-black ${c.efficiency_gap >= 0
                      ? 'text-emerald-700'
                      : 'text-red-700'
                      }`}
                  >
                    {pct(c.efficiency_gap)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CAMPAIGN SNAPSHOT */}
      <div className="rounded-3xl border bg-white/90 p-6 shadow-sm">
        <h3 className="mb-1 text-xl font-black">Campaign Spend Snapshot</h3>
        <p className="mb-4 text-sm text-slate-500">
          Top campaigns by spend. This shows where Google is consuming budget
          and whether that spend is efficient.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="py-3 pr-4">Campaign</th>
                <th className="py-3 pr-4">Channel</th>
                <th className="py-3 pr-4 text-right">Spend</th>
                <th className="py-3 pr-4 text-right">Revenue</th>
                <th className="py-3 pr-4 text-right">ROAS</th>
                <th className="py-3 pr-4 text-right">CPA</th>
                <th className="py-3 text-right">Action</th>
              </tr>
            </thead>

            <tbody>
              {campaigns.map((c: any, i: number) => {
                const action = getCampaignAction(c.roas, c.cpa, totals.roas, totals.cpa);

                return (
                  <tr key={i} className="border-b last:border-0">
                    <td className="max-w-[340px] truncate py-3 pr-4 font-black">
                      {c.campaign_name}
                    </td>
                    <td className="py-3 pr-4 text-slate-600">
                      {c.channel_type}
                    </td>
                    <td className="py-3 pr-4 text-right">{money(c.spend)}</td>
                    <td className="py-3 pr-4 text-right">{money(c.revenue)}</td>
                    <td className="py-3 pr-4 text-right font-bold">
                      {c.roas?.toFixed(2)}
                    </td>
                    <td className="py-3 pr-4 text-right">{money(c.cpa)}</td>
                    <td
                      className={`py-3 text-right font-black ${action.color}`}
                    >
                      {action.label}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function getCampaignAction(
  roas: number,
  cpa: number,
  accountRoas: number,
  accountCpa: number
) {
  if ((roas || 0) >= accountRoas && (cpa || 0) <= accountCpa) {
    return { label: 'Scale', color: 'text-emerald-700' };
  }

  if ((roas || 0) < accountRoas * 0.6 && (cpa || 0) > accountCpa * 1.3) {
    return { label: 'Reduce', color: 'text-red-700' };
  }

  if ((roas || 0) < accountRoas) {
    return { label: 'Watch', color: 'text-amber-700' };
  }

  return { label: 'Hold', color: 'text-slate-600' };
}

function Card({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="rounded-3xl border bg-white/90 p-4 shadow-sm">
      <p className="text-xs font-bold uppercase text-slate-500">{title}</p>
      <p className="mt-1 text-xl font-black">{value}</p>
    </div>
  );
}