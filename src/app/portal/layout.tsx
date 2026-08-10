"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    const userStr = localStorage.getItem("user");
    const isAuthPage = pathname === "/portal/login" || pathname === "/portal/register";

    if (!token || !userStr) {
      if (isAuthPage) {
        setLoading(false);
        return;
      }
      router.replace("/portal/login");
      return;
    }

    try {
      const parsedUser = JSON.parse(userStr);
      setUser(parsedUser);
      setAuthorized(true);

      if (isAuthPage) {
        router.replace("/portal");
        return;
      }
    } catch {
      if (isAuthPage) {
        setLoading(false);
        return;
      }
      router.replace("/portal/login");
    } finally {
      setLoading(false);
    }
  }, [pathname, router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("token");
    router.replace("/portal/login");
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-zinc-950">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  const isAuthPage = pathname === "/portal/login" || pathname === "/portal/register";
  if (isAuthPage) {
    return <div className="min-h-screen bg-zinc-950 text-slate-100">{children}</div>;
  }

  if (!authorized) {
    return null;
  }

  const navItems = [
    { name: "Dashboard", href: "/portal", icon: "📊" },
    { name: "Transactions", href: "/portal/transactions", icon: "💸" },
    { name: "Analytics", href: "/portal/analytics", icon: "📈" },
    { name: "Calendar", href: "/portal/calendar", icon: "📅" },
    { name: "Settings", href: "/portal/settings", icon: "⚙️" },
  ];

  return (
    <div className="flex h-screen w-screen flex-col md:flex-row overflow-hidden bg-zinc-950 text-slate-100 font-sans">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex w-64 flex-col border-r border-zinc-800/80 bg-zinc-900/40 backdrop-blur-xl">
        <div className="flex h-16 items-center px-6 border-b border-zinc-800/80 gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 font-bold text-white">M</div>
          <span className="text-lg font-bold tracking-tight text-white">MoneyManage</span>
        </div>

        <nav className="flex-1 space-y-1.5 px-4 py-6">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition ${
                  isActive
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/10"
                    : "text-slate-400 hover:bg-zinc-800/60 hover:text-white"
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Card */}
        <div className="border-t border-zinc-800/80 p-4">
          <div className="flex items-center justify-between">
            <div className="truncate pr-2">
              <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-slate-400 hover:text-rose-400 transition p-2 rounded-lg hover:bg-zinc-800/40"
              title="Logout"
            >
              🚪
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="flex md:hidden h-14 items-center justify-between border-b border-zinc-800/80 bg-zinc-900/60 backdrop-blur px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-600 font-bold text-white text-xs">M</div>
          <span className="text-sm font-bold text-white">MoneyManage</span>
        </div>
        <button
          onClick={handleLogout}
          className="text-slate-400 hover:text-rose-400 p-2 rounded-lg"
          title="Logout"
        >
          🚪
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-8 p-4 md:p-8">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>

      {/* Bottom navigation bar for Mobile PWAs */}
      <nav className="flex md:hidden fixed bottom-0 left-0 right-0 h-16 border-t border-zinc-800/80 bg-zinc-900/80 backdrop-blur-lg justify-around items-center z-50 px-2 pb-safe">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 py-1 gap-1 text-[10px] font-medium transition ${
                isActive ? "text-blue-500" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
