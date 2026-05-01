import { useState } from 'react';
import GoogleOSSettings, { defaultSettings, GoogleOSSettingsState } from './GoogleOSSettings';

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

export default function GoogleOS() {
  const [activeGoogleTab, setActiveGoogleTab] = useState('Settings');
  const [googleSettings, setGoogleSettings] = useState<GoogleOSSettingsState>(defaultSettings);

  return (
    <section className="rounded-[2rem] border border-white/70 bg-white/95 p-6 shadow-2xl shadow-slate-200/70 backdrop-blur-xl">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">Google OS</p>
          <h2 className="mt-1 text-3xl font-black tracking-[-0.05em]">Search & Intent Decision System</h2>
          <p className="mt-1 max-w-3xl text-slate-500">
            Settings, channel mix, campaign diagnosis, ad group control, search terms, keywords, funnel and alerts.
          </p>
        </div>
        <div className="rounded-full border bg-white px-4 py-2 text-sm font-black text-slate-700 shadow-sm">
          Search Terms First System
        </div>
      </div>

      <div className="mb-6 flex max-w-full gap-2 overflow-x-auto rounded-2xl bg-slate-950 p-2 shadow-inner">
        {googleTabs.map((tab: string) => (
          <button
            key={tab}
            onClick={() => setActiveGoogleTab(tab)}
            className={
              activeGoogleTab === tab
                ? 'whitespace-nowrap rounded-xl bg-white px-4 py-2 text-sm font-black text-slate-950 shadow-sm'
                : 'whitespace-nowrap rounded-xl px-4 py-2 text-sm font-bold text-slate-400 hover:bg-white/10 hover:text-white'
            }
          >
            {tab}
          </button>
        ))}
      </div>

      {activeGoogleTab === 'Settings' && (
        <div className="rounded-3xl border bg-slate-50 p-6 shadow-sm">
          <GoogleOSSettings settings={googleSettings} setSettings={setGoogleSettings} />
        </div>
      )}

      {activeGoogleTab !== 'Settings' && (
        <div className="space-y-6">
          <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <DataTile label="Module" value={activeGoogleTab} />
            <DataTile label="Primary Use" value={activeGoogleTab === 'Search Terms' ? 'Negative / Positive Keyword Decisions' : 'Performance Diagnosis'} />
            <DataTile label="Status" value="UI Ready" />
          </section>

          <Panel title={activeGoogleTab + ' Workspace'}>
            <EmptyState
              title={activeGoogleTab + ' logic comes next'}
              text="The Claude-style UI shell is integrated. Now connect this tab to your Google OS API/table logic without touching the design system."
            />
          </Panel>

          <PanelDark title="Decision Logic Placeholder">
            <RiskBox title="Keep" text="Use this area for winners, positives, profitable campaigns or scalable signals." />
            <RiskBox title="Watch" text="Use this area for low-data terms, volatile campaigns or learning-stage assets." />
            <RiskBox title="Block / Fix" text="Use this area for waste, negatives, CPA leaks or funnel drop-offs." />
          </PanelDark>
        </div>
      )}
    </section>
  );
}

function Panel({ title, children }: any) {
  return (
    <section className="rounded-[2rem] border border-white/70 bg-white p-6 shadow-2xl shadow-slate-200/70">
      <h3 className="mb-4 text-lg font-black tracking-tight">{title}</h3>
      {children}
    </section>
  );
}

function PanelDark({ title, children }: any) {
  return (
    <section className="rounded-[2rem] border border-slate-800 bg-gradient-to-br from-slate-950 to-slate-900 p-6 text-white shadow-2xl shadow-slate-900/25">
      <h3 className="mb-4 text-lg font-black tracking-tight">{title}</h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">{children}</div>
    </section>
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

function RiskBox({ title, text }: any) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
      <h4 className="font-black text-white">{title}</h4>
      <p className="mt-2 text-sm text-slate-400">{text}</p>
    </div>
  );
}

function EmptyState({ title, text }: any) {
  return <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white/80 p-10 shadow-xl shadow-slate-200/70"><h3 className="text-xl font-black">{title}</h3><p className="mt-2 text-slate-500">{text}</p></div>;
}
