'use client';

type Props = {
  startDate: string;
  endDate: string;
};

export default function ProductInsights({ startDate, endDate }: Props) {
  return (
    <div className="bg-white p-4 rounded-lg border">
      <h2 className="text-lg font-semibold mb-2">Product Insights</h2>
      <p className="text-sm text-gray-500">
        {startDate} → {endDate}
      </p>
    </div>
  );
}