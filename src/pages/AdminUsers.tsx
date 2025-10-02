import { useMemo, useState } from "react";

interface UserRow {
  id: number;
  username: string;
  email: string;
  role: "User" | "Author" | "Admin";
  status: "Active" | "Suspended" | "Pending";
}

export default function AdminUsers() {
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const rows = useMemo<UserRow[]>(() => {
    const base: UserRow[] = Array.from({ length: 87 }).map((_, i) => ({
      id: 1000 + i,
      username: `user_${i}`,
      email: `user_${i}@mail.com`,
      role: i % 15 === 0 ? "Admin" : i % 4 === 0 ? "Author" : "User",
      status: i % 11 === 0 ? "Suspended" : i % 6 === 0 ? "Pending" : "Active",
    }));
    return base;
  }, []);

  const filtered = useMemo(() => rows.filter(r =>
    (!query || `${r.username} ${r.email}`.toLowerCase().includes(query.toLowerCase())) &&
    (role === "all" || r.role.toLowerCase() === role) &&
    (status === "all" || r.status.toLowerCase() === status)
  ), [rows, query, role, status]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="mt-5 min-h-screen bg-gradient-to-b from-white to-blue-50 pt-8">
      <div className="max-w-6xl mx-auto">
        <div className="rounded-2xl overflow-hidden shadow-xl border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Users</h1>
            <div className="flex items-center gap-2">
              <button className="cursor-pointer px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold">Add User</button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
            <input className="rounded-xl border border-gray-300 px-3 py-2" placeholder="Search name or email" value={query} onChange={(e)=>{ setQuery(e.target.value); setPage(1); }} />
            <select className="rounded-xl border border-gray-300 px-3 py-2" value={role} onChange={(e)=>{ setRole(e.target.value); setPage(1);} }>
              <option value="all">Role: All</option>
              <option value="user">User</option>
              <option value="author">Author</option>
              <option value="admin">Admin</option>
            </select>
            <select className="rounded-xl border border-gray-300 px-3 py-2" value={status} onChange={(e)=>{ setStatus(e.target.value); setPage(1);} }>
              <option value="all">Status: All</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
            </select>
            <select className="rounded-xl border border-gray-300 px-3 py-2" value={pageSize} onChange={(e)=> { setPageSize(Number(e.target.value)); setPage(1);} }>
              <option value={10}>10 / page</option>
              <option value={20}>20 / page</option>
              <option value={50}>50 / page</option>
            </select>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-gray-200">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="text-left text-gray-600">
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Username</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map(r => (
                  <tr key={r.id} className="border-t">
                    <td className="px-4 py-3 text-gray-700">{r.id}</td>
                    <td className="px-4 py-3 text-gray-800 font-medium">{r.username}</td>
                    <td className="px-4 py-3 text-gray-700">{r.email}</td>
                    <td className="px-4 py-3"><span className="px-2 py-1 rounded-lg text-xs bg-gray-100 text-gray-700">{r.role}</span></td>
                    <td className="px-4 py-3"><span className={`px-2 py-1 rounded-lg text-xs ${r.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : r.status === 'Pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{r.status}</span></td>
                    <td className="px-4 py-3 text-sm">
                      <button className="cursor-pointer px-3 py-1 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 mr-2">View</button>
                      <button className="cursor-pointer px-3 py-1 rounded-lg bg-red-50 text-red-700 hover:bg-red-100">Suspend</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-end items-center gap-2 p-3">
              <button disabled={page===1} onClick={()=>setPage(1)} className="px-3 py-1 rounded bg-gray-100">First</button>
              <button disabled={page===1} onClick={()=>setPage(page-1)} className="px-3 py-1 rounded bg-gray-100">Prev</button>
              <span className="text-sm">Page {page} / {totalPages}</span>
              <button disabled={page===totalPages} onClick={()=>setPage(page+1)} className="px-3 py-1 rounded bg-gray-100">Next</button>
              <button disabled={page===totalPages} onClick={()=>setPage(totalPages)} className="px-3 py-1 rounded bg-gray-100">Last</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
