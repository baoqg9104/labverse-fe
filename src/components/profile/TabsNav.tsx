type Tab = { key: string; label: string; icon: string };

type Props = {
  tabs: ReadonlyArray<Tab>;
  activeTab: string;
  onChange: (key: string) => void;
};

export function TabsNav({ tabs, activeTab, onChange }: Props) {
  return (
    <div className="w-full bg-white border-b border-gray-200">
      <div className="flex justify-center">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`cursor-pointer group flex items-center gap-2 px-8 py-4 font-semibold transition-all duration-300 relative ${
              activeTab === tab.key
                ? "text-blue-600 bg-blue-50"
                : "text-gray-600 hover:text-blue-600 hover:bg-blue-50/50"
            }`}
            onClick={() => onChange(tab.key)}
          >
            <span className="text-lg">{tab.icon}</span>
            <span>{tab.label}</span>
            {activeTab === tab.key && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-t-full" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
