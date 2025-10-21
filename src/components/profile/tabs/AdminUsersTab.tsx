import type { User } from "../../../types/user";

export default function AdminUsersTab({ userList }: { userList: User[] }) {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <span>👥</span>Users
        </h3>
        <input className="rounded-xl border border-gray-300 px-4 py-2" placeholder="Search users..." />
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
                <td className="px-4 py-3 font-medium text-gray-800">{u.username}</td>
                <td className="px-4 py-3 text-gray-700">{u.email}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-1 rounded-lg text-xs bg-gray-100 text-gray-700">
                    {u.role === 2 ? "Admin" : u.role === 1 ? "Author" : "User"}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-700">Verified</td>
                <td className="px-4 py-3 text-sm">
                  <button className="cursor-pointer px-3 py-1 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 mr-2">View</button>
                  <button className="cursor-pointer px-3 py-1 rounded-lg bg-red-50 text-red-700 hover:bg-red-100">Suspend</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
