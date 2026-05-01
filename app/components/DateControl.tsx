type DateControlProps = {
  start: string;
  end: string;
  compareStart: string;
  compareEnd: string;
  setStart: (value: string) => void;
  setEnd: (value: string) => void;
  setCompareStart: (value: string) => void;
  setCompareEnd: (value: string) => void;
  onApply: () => void;
  loading: boolean;
  setPreset: (preset: "yesterday" | "l7" | "l14" | "l30" | "mtd" | "lastMonth") => void;
};

export default function DateControl({
  start,
  end,
  compareStart,
  compareEnd,
  setStart,
  setEnd,
  setCompareStart,
  setCompareEnd,
  onApply,
  loading,
  setPreset,
}: DateControlProps) {
  return (
    <section className="mb-7 rounded-[2rem] border border-white/70 bg-white/95 p-5 shadow-2xl shadow-slate-900/10 backdrop-blur-xl md:p-6">
      <div className="mb-5 flex items-end justify-between gap-6">
        <div>
          <h3 className="text-lg font-black tracking-tight">Date Control</h3>
          <p className="text-sm text-slate-500">Primary period vs comparison period</p>
        </div>
        <button onClick={onApply} className="rounded-2xl bg-gradient-to-r from-slate-950 to-slate-800 px-7 py-3 text-sm font-black text-white shadow-xl shadow-slate-900/20 transition hover:-translate-y-0.5">
          {loading ? 'Loading...' : 'Apply'}
        </button>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        <PresetButton onClick={() => setPreset("yesterday")}>Yesterday</PresetButton>
        <PresetButton onClick={() => setPreset("l7")}>Last 7 Days</PresetButton>
        <PresetButton onClick={() => setPreset("l14")}>Last 14 Days</PresetButton>
        <PresetButton onClick={() => setPreset("l30")}>Last 30 Days</PresetButton>
        <PresetButton onClick={() => setPreset("mtd")}>This Month</PresetButton>
        <PresetButton onClick={() => setPreset("lastMonth")}>Last Month</PresetButton>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Field label="Start Date" value={start} setValue={setStart} />
        <Field label="End Date" value={end} setValue={setEnd} />
        <Field label="Compare Start" value={compareStart} setValue={setCompareStart} />
        <Field label="Compare End" value={compareEnd} setValue={setCompareEnd} />
      </div>
    </section>
  );
}

function PresetButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-black text-slate-700 hover:border-slate-950 hover:bg-slate-950 hover:text-white">
      {children}
    </button>
  );
}

function Field({ label, value, setValue }: { label: string; value: string; setValue: (value: string) => void }) {
  return (
    <label>
      <span className="mb-1 block text-xs font-bold text-slate-500">{label}</span>
      <input type="date" value={value} onChange={(e) => setValue(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-black text-slate-900 outline-none ring-0 transition focus:border-slate-950 focus:shadow-lg" />
    </label>
  );
}
