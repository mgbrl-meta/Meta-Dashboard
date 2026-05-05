'use client';

import { useState } from 'react';

// Import tab components (we will create them next)
import ProductOverview from './product/ProductOverview';
import SkuPerformance from './product/SkuPerformance';
import DemandTrends from './product/DemandTrends';
import InventoryHealth from './product/InventoryHealth';
import Forecasting from './product/Forecasting';
import SeasonalityEngine from './product/SeasonalityEngine';
import ProductInsights from './product/ProductInsights';
import ProductSettings from './product/ProductSettings';

type Props = {
  startDate: string;
  endDate: string;
  compareStartDate?: string;
  compareEndDate?: string;
};

export default function ProductOS({
  startDate,
  endDate,
  compareStartDate,
  compareEndDate,
}: Props) {
  const [activeTab, setActiveTab] = useState('Overview');

  const tabs = [
    'Overview',
    'SKU Performance',
    'Demand Trends',
    'Inventory Health',
    'Forecasting',
    'Seasonality',
    'Insights',
    'Settings',
  ];

  return (
    <div className="mt-6">
      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg border text-sm ${
              activeTab === tab
                ? 'bg-black text-white'
                : 'bg-white text-black'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'Overview' && (
          <ProductOverview startDate={startDate} endDate={endDate} />
        )}

        {activeTab === 'SKU Performance' && (
          <SkuPerformance startDate={startDate} endDate={endDate} />
        )}

        {activeTab === 'Demand Trends' && (
          <DemandTrends startDate={startDate} endDate={endDate} />
        )}

        {activeTab === 'Inventory Health' && (
          <InventoryHealth startDate={startDate} endDate={endDate} />
        )}

        {activeTab === 'Forecasting' && (
          <Forecasting startDate={startDate} endDate={endDate} />
        )}

        {activeTab === 'Seasonality' && (
          <SeasonalityEngine startDate={startDate} endDate={endDate} />
        )}

        {activeTab === 'Insights' && (
          <ProductInsights startDate={startDate} endDate={endDate} />
        )}

        {activeTab === 'Settings' && <ProductSettings />}
      </div>
    </div>
  );
}