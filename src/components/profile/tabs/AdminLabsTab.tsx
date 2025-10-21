export default function AdminLabsTab() {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <span>🗒️</span>Labs
        </h3>
        <div className="flex items-center gap-2">
          <select className="rounded-xl border border-gray-300 px-3 py-2">
            <option>Status: All</option>
            <option>Published</option>
            <option>Draft</option>
          </select>
          <input className="rounded-xl border border-gray-300 px-3 py-2" placeholder="Search labs..." />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="p-5 rounded-2xl bg-white border border-gray-200 hover:shadow transition">
            <div className="text-lg font-semibold text-gray-800">Lab #{i} - Security Basics</div>
            <div className="mt-2 text-sm text-gray-600">By John Doe • 2.{i}K views • {i * 3} comments</div>
            <div className="mt-4 flex items-center gap-2">
              <span className="px-2 py-1 rounded-lg bg-emerald-100 text-emerald-700 text-xs">Published</span>
              <span className="px-2 py-1 rounded-lg bg-indigo-100 text-indigo-700 text-xs">Beginner</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
