"use client";

import React, { useEffect, useState } from "react";

interface UserItem {
  _id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
}

export default function AdminUsersManagement() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [limit] = useState(10);
  const [offset, setOffset] = useState(0);
  
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Debouncing search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setOffset(0); // reset page on search
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const query = new URLSearchParams({
        search: debouncedSearch,
        limit: limit.toString(),
        offset: offset.toString(),
      });
      const res = await fetch(`/api/v1/admin/users?${query.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const json = await res.json();
      if (json.success) {
        setUsers(json.data.users);
        setTotal(json.data.total);
      } else {
        setError(json.message || "Failed to load users list");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [debouncedSearch, offset, limit]);

  const handleUpdateUser = async (userId: string, updates: { role?: string; status?: string }) => {
    setActionLoading(userId);
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const res = await fetch(`/api/v1/admin/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });
      const json = await res.json();
      if (json.success) {
        // Refresh local items
        setUsers((prev) =>
          prev.map((u) => (u._id === userId ? { ...u, ...json.data } : u))
        );
      } else {
        alert(json.message || "Update failed");
      }
    } catch (err: any) {
      alert(err.message || "Update failed");
    } finally {
      setActionLoading(null);
    }
  };

  const handlePageChange = (newOffset: number) => {
    if (newOffset >= 0 && newOffset < total) {
      setOffset(newOffset);
    }
  };

  const roleOptions = ["SUPER_ADMIN", "ADMIN", "SUPPORT", "ANALYST", "MODERATOR", "USER"];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <p className="mt-1 text-sm text-gray-500">
          Search, update roles, or suspend user access credentials across the platform.
        </p>
      </div>

      {/* Search and filters bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="relative w-full sm:max-w-xs">
          <input
            type="text"
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Search name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <span className="absolute left-3 top-2.5 text-gray-400 text-sm">🔍</span>
        </div>
        <div className="text-xs text-gray-500 font-medium">
          Showing {offset + 1} - {Math.min(offset + limit, total)} of {total} users
        </div>
      </div>

      {/* Users table */}
      <div className="overflow-hidden rounded-xl bg-white shadow-sm border border-gray-100">
        {loading && users.length === 0 ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          </div>
        ) : error ? (
          <div className="p-6 text-center text-sm text-red-600">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined Date</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 text-sm">
                {users.map((item) => {
                  const isSuspended = item.status === "SUSPENDED";
                  const isPendingAction = actionLoading === item._id;

                  return (
                    <tr key={item._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{item.name}</div>
                        <div className="text-xs text-gray-500">{item.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          className="bg-gray-50 border border-gray-300 text-gray-900 text-xs rounded-lg focus:ring-blue-500 focus:border-blue-500 p-1.5"
                          value={item.role}
                          disabled={isPendingAction}
                          onChange={(e) => handleUpdateUser(item._id, { role: e.target.value })}
                        >
                          {roleOptions.map((role) => (
                            <option key={role} value={role}>
                              {role}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                          isSuspended ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                        {new Date(item.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right font-medium">
                        <button
                          onClick={() =>
                            handleUpdateUser(item._id, {
                              status: isSuspended ? "ACTIVE" : "SUSPENDED",
                            })
                          }
                          disabled={isPendingAction}
                          className={`text-xs px-3 py-1.5 rounded-lg border font-semibold transition-all ${
                            isSuspended
                              ? "bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                              : "bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                          } ${isPendingAction ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                          {isPendingAction ? "Updating..." : isSuspended ? "Activate" : "Suspend"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-gray-400">
                      No users match the search criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination controls */}
        {total > limit && (
          <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-200">
            <button
              onClick={() => handlePageChange(offset - limit)}
              disabled={offset === 0}
              className="px-3 py-1.5 text-xs font-semibold border rounded-lg bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Previous
            </button>
            <button
              onClick={() => handlePageChange(offset + limit)}
              disabled={offset + limit >= total}
              className="px-3 py-1.5 text-xs font-semibold border rounded-lg bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
