import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { getRoleMeta } from "../components/profile/RoleUtils";
import { Link } from "react-router-dom";

export default function AdminConsole() {
  const { user } = useContext(AuthContext);
  const roleMeta = getRoleMeta(user?.role);

  return (
    <div className="mt-5 min-h-screen bg-gradient-to-b from-white to-blue-50 pt-8 pb-8">
      <div className="max-w-6xl mx-auto">
        <div className="rounded-2xl overflow-hidden shadow-xl border border-gray-200 bg-white p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Admin Console
              </h1>
              <p className="text-gray-600">
                Manage users, labs, reports, and revenue
              </p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-sm font-semibold ${roleMeta.badgeClass}`}
            >
              {roleMeta.label}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[
              {
                label: "Total Users",
                value: "1,284",
                icon: "👥",
                color: "from-blue-500 to-indigo-600",
              },
              {
                label: "Total Labs",
                value: "376",
                icon: "🗒️",
                color: "from-purple-500 to-violet-600",
              },
              {
                label: "Revenue (VND)",
                value: new Intl.NumberFormat("vi-VN", {
                  style: "currency",
                  currency: "VND",
                  maximumFractionDigits: 0,
                }).format(12400000),
                icon: "💰",
                color: "from-amber-500 to-orange-600",
              },
            ].map((c, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-white border border-gray-200 shadow"
              >
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${c.color} text-white flex items-center justify-center text-xl mb-3`}
                >
                  {c.icon}
                </div>
                <div className="text-2xl font-bold text-gray-800">
                  {c.value}
                </div>
                <div className="text-gray-600">{c.label}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-white border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <span>👥</span> Users
              </h2>
              <div className="h-40 rounded-xl bg-gray-50 border border-dashed border-gray-300 flex items-center justify-center text-gray-500">
                <Link
                  to="/admin/users"
                  className="cursor-pointer px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-semibold"
                >
                  Open Users
                </Link>
              </div>
            </div>
            <div className="p-6 rounded-2xl bg-white border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <span>🗒️</span> Labs
              </h2>
              <div className="h-40 rounded-xl bg-gray-50 border border-dashed border-gray-300 flex items-center justify-center text-gray-500">
                <Link
                  to="/admin/labs"
                  className="cursor-pointer px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold"
                >
                  Open Labs
                </Link>
              </div>
            </div>
            <div className="p-6 rounded-2xl bg-white border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <span>📑</span> Reports
              </h2>
              <div className="h-40 rounded-xl bg-gray-50 border border-dashed border-gray-300 flex items-center justify-center text-gray-500">
                <Link
                  to="/admin/reports"
                  className="cursor-pointer px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold"
                >
                  Open Reports
                </Link>
              </div>
            </div>
            <div className="p-6 rounded-2xl bg-white border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <span>💰</span> Revenue
              </h2>
              <div className="h-40 rounded-xl bg-gray-50 border border-dashed border-gray-300 flex items-center justify-center text-gray-500">
                <Link
                  to="/admin/revenue"
                  className="cursor-pointer px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                >
                  Open Revenue
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
