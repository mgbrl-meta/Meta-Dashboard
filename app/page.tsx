"use client";

import { useEffect, useState } from "react";

export default function Dashboard() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/ceo-summary")
      .then((res) => res.json())
      .then(setData);
  }, []);

  const latest = data[0];

  if (!latest) return <main className="p-8">Loading CEO Dashboard...</main>;

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold mb-2">GrowthOS CEO Dashboard</h1>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <Card title="Revenue" value={latest.revenue} prefix="₹" />
        <Card title="Total Spend" value={latest.total_spend} prefix="₹" />
        <Card title="ROAS" value={latest.blended_roas} />
        <Card title="CAC" value={latest.blended_cac} prefix="₹" />
      </div>
    </main>
  );
}

function Card({ title, value, prefix = "" }: any) {
  return (
    <div className="p-4 border rounded">
      <p>{title}</p>
      <h2>
        {prefix}
        {Number(value || 0).toLocaleString("en-IN")}
      </h2>
    </div>
  );
}