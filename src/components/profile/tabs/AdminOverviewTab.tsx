export default function AdminOverviewTab() {
  const cards = [
    { label: "Total Users", value: "1,284", icon: "👥", color: "from-blue-500 to-indigo-600" },
    { label: "Active Today", value: "214", icon: "⚡", color: "from-emerald-500 to-green-600" },
    { label: "Total Labs", value: "376", icon: "🗒️", color: "from-purple-500 to-violet-600" },
    { label: "Revenue (M)", value: "$12.4", icon: "💰", color: "from-amber-500 to-orange-600" },
  ];
  return (
    <div className="max-w-6xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {cards.map((c, idx) => (
          <div key={idx} className="p-6 rounded-2xl bg-white border border-gray-200 shadow">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${c.color} text-white flex items-center justify-center text-xl mb-3`}>
              {c.icon}
            </div>
            <div className="text-2xl font-bold text-gray-800">{c.value}</div>
            <div className="text-gray-600">{c.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
