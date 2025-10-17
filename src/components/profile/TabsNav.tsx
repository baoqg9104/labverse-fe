type Tab = { key: string; label: string; icon: string };

type Props = {
  tabs: ReadonlyArray<Tab>;
  activeTab: string;
  onChange: (key: string) => void;
};

export function TabsNav({ tabs, activeTab, onChange }: Props) {
  return (
    <div className="w-full border-b border-slate-200 bg-white">
      <div className="flex flex-wrap justify-center gap-2 px-4 py-3">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              className={`cursor-pointer group relative flex items-center gap-2 overflow-hidden rounded-2xl px-6 py-3 text-sm font-semibold uppercase tracking-wide transition-all duration-300 ${
                isActive
                  ? "text-sky-700 shadow"
                  : "text-slate-500 hover:text-slate-700"
              }`}
              onClick={() => onChange(tab.key)}
            >
              <span
                className={`relative z-10 text-lg transition-transform duration-300 ${
                  isActive ? "scale-110" : "group-hover:scale-110"
                }`}
              >
                {tab.icon}
              </span>
              <span className="relative z-10">{tab.label}</span>
              <span
                className={`pointer-events-none absolute inset-0 z-0 rounded-2xl border border-transparent transition-all duration-300 ${
                  isActive
                    ? "border-sky-200 bg-gradient-to-r from-sky-100 via-indigo-100 to-purple-100"
                    : "group-hover:border-slate-200 group-hover:bg-slate-100/60"
                }`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
