import BadgeList from "../BadgeList";
import type { Badge } from "../../types/badge";
import type { User } from "../../types/user";
import CreateLab from "../labs/CreateLab";
import CreateQuestions from "../questions/CreateQuestion";
import ViewQuestions from "../questions/ViewQuestions"; // Add this import
import { ROLE } from "./RoleUtils";

type Props = {
  activeTab: string;
  badges: Badge[];
  profile: User | null;
  userList: User[];
};

export function RoleTabContent({
  activeTab,
  badges,
  profile,
  userList,
}: Props) {
  const role = profile?.role;
  return (
    <div className="w-full p-8">
      {activeTab === "info" && (
        <div className="max-w-3xl mx-auto">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100">
            <h3 className="text-2xl font-bold mb-4 text-gray-800 flex items-center gap-2">
              <span className="text-2xl">📝</span>
              About
            </h3>
            <div className="text-gray-700 text-lg leading-relaxed whitespace-pre-line">
              {profile?.bio ||
                "No bio available yet. Click 'Edit Profile' to add your story!"}
            </div>
          </div>
        </div>
      )}

      {activeTab === "badges" && (
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2 mb-2">
              <span className="text-2xl">🏆</span>
              Achievements & Badges
            </h3>
            <p className="text-gray-600">
              Your collection of earned badges and achievements
            </p>
          </div>
          <BadgeList badges={badges} />
        </div>
      )}

      {activeTab === "activity" && (
        <div className="max-w-3xl mx-auto">
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2 mb-2">
              <span className="text-2xl">📊</span>
              Recent Activity
            </h3>
            <p className="text-gray-600">
              Your latest activities and accomplishments
            </p>
          </div>
          <div className="space-y-4">
            {[
              {
                type: "lab",
                title: "Completed lab 'SQL Injection'",
                date: "2025-09-20",
                icon: "✅",
              },
              {
                type: "badge",
                title: "Received badge 'Starter'",
                date: "2025-09-18",
                icon: "🏅",
              },
              {
                type: "profile",
                title: "Updated profile information",
                date: "2025-09-15",
                icon: "✏️",
              },
            ].map((activity, index) => (
              <div
                key={index}
                className="flex items-center gap-4 p-4 bg-gradient-to-r from-white to-gray-50 rounded-xl border border-gray-200 hover:shadow-md transition-all duration-300"
              >
                <div className="text-2xl">{activity.icon}</div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-800">
                    {activity.title}
                  </div>
                  <div className="text-sm text-gray-600">{activity.date}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "myLabs" && (
        <div className="max-w-5xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2 mb-1">
                <span className="text-2xl">🗒️</span>
                My Labs
              </h3>
              <p className="text-gray-600">
                Manage and track your published and draft labs.
              </p>
            </div>
            <button className="cursor-pointer px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow">
              Create New Lab
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="p-5 rounded-2xl bg-white border border-gray-200 hover:shadow transition"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-lg font-semibold text-gray-800">
                      Lab Title #{i}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      Status: {i % 2 ? "Draft" : "Published"}
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${i % 2
                        ? "bg-gray-100 text-gray-700"
                        : "bg-emerald-100 text-emerald-700"
                      }`}
                  >
                    {i % 2 ? "Draft" : "Published"}
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center gap-3">
                    <span>⭐ 4.{i}</span>
                    <span>👁️ {120 + i * 10}</span>
                    <span>📝 {8 + i}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="cursor-pointer px-3 py-1 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100">
                      Edit
                    </button>
                    <button className="cursor-pointer px-3 py-1 rounded-lg bg-red-50 text-red-700 hover:bg-red-100">
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "createLab" && (
        <CreateLab />
      )}

      {activeTab === "createQuestion" && (
        <CreateQuestions />
      )}

      {activeTab === "viewQuestions" && (
        <ViewQuestions />
      )}

      {activeTab === "overview" && role === ROLE.ADMIN && (
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              {
                label: "Total Users",
                value: "1,284",
                icon: "👥",
                color: "from-blue-500 to-indigo-600",
              },
              {
                label: "Active Today",
                value: "214",
                icon: "⚡",
                color: "from-emerald-500 to-green-600",
              },
              {
                label: "Total Labs",
                value: "376",
                icon: "🗒️",
                color: "from-purple-500 to-violet-600",
              },
              {
                label: "Revenue (M)",
                value: "$12.4",
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
        </div>
      )}

      {activeTab === "users" && role === ROLE.ADMIN && (
        <div className="max-w-5xl mx-auto">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <span>👥</span>Users
            </h3>
            <input
              className="rounded-xl border border-gray-300 px-4 py-2"
              placeholder="Search users..."
            />
          </div>
          <div className="overflow-x-auto rounded-2xl border border-gray-200">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="text-left text-gray-600">
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {userList.slice(0, 6).map((u, i) => (
                  <tr key={i} className="border-t">
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {u.username}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded-lg text-xs bg-gray-100 text-gray-700">
                        {u.role === 2
                          ? "Admin"
                          : u.role === 1
                            ? "Author"
                            : "User"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">Verified</td>
                    <td className="px-4 py-3 text-sm">
                      <button className="cursor-pointer px-3 py-1 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 mr-2">
                        View
                      </button>
                      <button className="cursor-pointer px-3 py-1 rounded-lg bg-red-50 text-red-700 hover:bg-red-100">
                        Suspend
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "labs" && role === ROLE.ADMIN && (
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
              <input
                className="rounded-xl border border-gray-300 px-3 py-2"
                placeholder="Search labs..."
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="p-5 rounded-2xl bg-white border border-gray-200 hover:shadow transition"
              >
                <div className="text-lg font-semibold text-gray-800">
                  Lab #{i} - Security Basics
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  By John Doe • 2.{i}K views • {i * 3} comments
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <span className="px-2 py-1 rounded-lg bg-emerald-100 text-emerald-700 text-xs">
                    Published
                  </span>
                  <span className="px-2 py-1 rounded-lg bg-indigo-100 text-indigo-700 text-xs">
                    Beginner
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "reports" && role === ROLE.ADMIN && (
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
              <input
                className="rounded-xl border border-gray-300 px-3 py-2"
                placeholder="Search..."
              />
            </div>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl border border-gray-200 flex items-center justify-between"
                >
                  <div>
                    <div className="font-semibold text-gray-800">
                      Report #{i} • Abuse
                    </div>
                    <div className="text-sm text-gray-600">
                      User: user{i}@mail.com • Lab: Intro to XSS
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <button className="cursor-pointer px-3 py-1 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100">
                      Review
                    </button>
                    <button className="cursor-pointer px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100">
                      Resolve
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "revenue" && role === ROLE.ADMIN && (
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
      )}
    </div>
  );
}