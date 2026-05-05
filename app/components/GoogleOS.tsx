'use client';

import { useState } from 'react';

import GoogleSettings, {
  defaultSettings,
  GoogleSettingsState,
} from './google/GoogleSettings';

import GoogleOverview from './google/GoogleOverview';
import GoogleChannelMix from './google/GoogleChannelMix';
import GoogleCampaign from './google/GoogleCampaign';
import GoogleAdGroup from './google/GoogleAdGroup';
import GoogleSearchTerms from './google/GoogleSearchTerms';
import GoogleKeywords from './google/GoogleKeywords';
import GoogleFunnel from './google/GoogleFunnel';
import GoogleAlerts from './google/GoogleAlerts';

type Props = {
  startDate: string;
  endDate: string;
  compareStartDate?: string;
  compareEndDate?: string;
};

export default function GoogleOS({

  startDate,
  endDate,
  compareStartDate,
  compareEndDate,
}: Props) {

  const [activeGoogleTab, setActiveGoogleTab] = useState('Settings');

  const [googleSettings, setGoogleSettings] =
    useState<GoogleSettingsState>(defaultSettings);

  const googleTabs = [
    'Settings',
    'Overview',
    'Channel Mix',
    'Campaign',
    'Ad Group',
    'Search Terms',
    'Keywords',
    'Funnel',
    'Alerts',
  ];

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="rounded-[2rem] border bg-white/90 p-6 shadow-sm backdrop-blur-xl">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">
          Google OS
        </p>

        <h2 className="mt-1 text-3xl font-black tracking-[-0.05em]">
          Intent Intelligence System
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Search terms, keywords, campaigns, waste detection and scaling signals.
        </p>

        {/* Tabs */}
        <div className="mt-4 flex max-w-full gap-1 overflow-x-auto rounded-full bg-slate-200/70 p-1">
          {googleTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveGoogleTab(tab)}
              className={
                activeGoogleTab === tab
                  ? 'whitespace-nowrap rounded-full bg-white px-4 py-2 text-sm font-black shadow-sm'
                  : 'whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-900'
              }
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}

      {activeGoogleTab === 'Settings' && (
        <GoogleSettings
          settings={googleSettings}
          setSettings={setGoogleSettings}
        />
      )}

      {activeGoogleTab === 'Overview' && (
        <GoogleOverview startDate={startDate} endDate={endDate} />
      )}

      {activeGoogleTab === 'Channel Mix' && (
        <GoogleChannelMix startDate={startDate} endDate={endDate} />
      )}

      {activeGoogleTab === 'Campaign' && (
        <GoogleCampaign startDate={startDate} endDate={endDate} />
      )}

      {activeGoogleTab === 'Ad Group' && (
        <GoogleAdGroup startDate={startDate} endDate={endDate} />
      )}

      {activeGoogleTab === 'Search Terms' && (
        <GoogleSearchTerms startDate={startDate} endDate={endDate} settings={googleSettings} />
      )}

      {activeGoogleTab === 'Keywords' && (
         <GoogleKeywords startDate={startDate} endDate={endDate} />
      )}

      {activeGoogleTab === 'Funnel' && (
        <GoogleFunnel startDate={startDate} endDate={endDate} />
      )}

      {activeGoogleTab === 'Alerts' && (
        <GoogleAlerts startDate={startDate} endDate={endDate} />
      )}
    </section>
  );
}