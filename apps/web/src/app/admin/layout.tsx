"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [adminUser, setAdminUser] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    const userStr = localStorage.getItem("user");
    const allowUnauthenticated = pathname === "/admin/login";

    if (!token || !userStr) {
      if (allowUnauthenticated) {
        setLoading(false);
        return;
      }
      router.replace("/admin/login");
      return;
    }

    try {
      const user = JSON.parse(userStr);
      if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
        alert("Access Denied: Administrative privileges required.");
        router.replace("/");
      } else {
        if (pathname === "/admin/login") {
          router.replace("/admin");
          return;
        }
        setAdminUser(user);
        setAuthorized(true);
      }
    } catch {
      if (allowUnauthenticated) {
        setLoading(false);
        return;
      }
      router.replace("/admin/login");
    } finally {
      setLoading(false);
    }
  }, [pathname, router]);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (!authorized) {
    return null;
  }

  const navLinks = [
    { name: "Dashboard", href: "/admin", icon: "📊" },
    { name: "User Management", href: "/admin/users", icon: "👥" },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.replace("/");
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-100 text-gray-800">
      {/* Sidebar */}
      <aside className="hidden w-64 flex-shrink-0 border-r border-gray-200 bg-white md:flex md:flex-col">
        <div className="flex h-16 items-center px-6 border-b border-gray-200 bg-white">
          <span className="text-xl font-bold text-gray-900 tracking-tight">Admin Console</span>
        </div>
        <nav className="flex-1 space-y-1 px-4 py-6 bg-white">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <span className="mr-3 text-lg">{link.icon}</span>
                {link.name}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-gray-200 p-4 bg-white">
          <div className="flex items-center justify-between">
            <div className="truncate">
              <p className="text-sm font-medium text-gray-900 truncate">{adminUser?.name}</p>
              <p className="text-xs text-gray-500 truncate">{adminUser?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-gray-400 hover:text-red-500 transition-colors p-1"
              title="Logout"
            >
              🚪
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Space */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
          <div className="flex items-center md:hidden">
            <span className="text-lg font-bold text-gray-900">Admin Console</span>
          </div>
          <div className="ml-auto flex items-center space-x-4">
            <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
              {adminUser?.role}
            </span>
          </div>
        </header>

        {/* Dynamic Children Panel */}
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  );
}
