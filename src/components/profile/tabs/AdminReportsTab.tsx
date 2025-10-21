export default function AdminReportsTab() {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="p-6 rounded-2xl bg-white border border-gray-200">
        <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span>📑</span>Reports
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <select className="rounded-xl border border-gray-300 px-3 py-2">
            <option>Period: Last 30 days</option>
            <option>Last 7 days</option>
            <option>All time</option>
          </select>
          <select className="rounded-xl border border-gray-300 px-3 py-2">
            <option>Type: All</option>
            <option>Abuse</option>
            <option>Bug</option>
            <option>Payment</option>
          </select>
          <input className="rounded-xl border border-gray-300 px-3 py-2" placeholder="Search..." />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-4 rounded-xl border border-gray-200 flex items-center justify-between">
              <div>
                <div className="font-semibold text-gray-800">Report #{i} • Abuse</div>
                <div className="text-sm text-gray-600">User: user{i}@mail.com • Lab: Intro to XSS</div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <button className="cursor-pointer px-3 py-1 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100">Review</button>
                <button className="cursor-pointer px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100">Resolve</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
