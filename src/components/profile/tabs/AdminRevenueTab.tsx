export default function AdminRevenueTab() {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="p-6 rounded-2xl bg-white border border-gray-200">
        <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span>💰</span>Revenue
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200">
            <div className="text-sm text-emerald-700">MRR</div>
            <div className="text-2xl font-bold text-emerald-800">$3.2K</div>
          </div>
          <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
            <div className="text-sm text-blue-700">New Subs</div>
            <div className="text-2xl font-bold text-blue-800">128</div>
          </div>
          <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200">
            <div className="text-sm text-amber-700">Churn</div>
            <div className="text-2xl font-bold text-amber-800">2.4%</div>
          </div>
        </div>
        <div className="h-48 rounded-xl bg-gray-50 border border-dashed border-gray-300 flex items-center justify-center text-gray-500">
          Chart placeholder
        </div>
      </div>
    </div>
  );
}
