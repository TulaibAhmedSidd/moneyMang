import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 font-sans text-slate-100 selection:bg-blue-500 selection:text-white">
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/4 h-[500px] w-[500px] rounded-full bg-blue-500/10 blur-[120px]" />
      <div className="absolute top-1/3 right-1/4 h-[600px] w-[600px] rounded-full bg-indigo-500/10 blur-[150px]" />
      <div className="absolute bottom-10 left-1/3 h-[500px] w-[500px] rounded-full bg-purple-500/10 blur-[130px]" />

      {/* Header */}
      <header className="relative z-10 mx-auto max-w-7xl px-6 py-6 md:px-8">
        <div className="flex items-center justify-between border-b border-slate-800/60 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30">
              <span className="text-xl font-bold text-white">M</span>
            </div>
            <span className="text-xl font-extrabold tracking-tight text-white">MoneyManage</span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <a href="#features" className="transition hover:text-white">Features</a>
            <a href="#platform" className="transition hover:text-white">The Platform</a>
            <a href="#architecture" className="transition hover:text-white">Architecture</a>
          </nav>

          <div>
            <Link
              href="/admin/login"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:from-blue-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-950"
            >
              Admin Console
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 mx-auto max-w-7xl px-6 pt-16 pb-24 sm:pt-20 md:px-8">
        <div className="grid gap-16 lg:grid-cols-12 lg:items-center">
          <div className="flex flex-col gap-6 lg:col-span-5">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/5 px-3.5 py-1 text-xs font-semibold tracking-wider text-blue-400 uppercase">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500"></span>
              </span>
              Vercel Deployment Active
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl lg:leading-[1.1]">
              Track Budgets & Manage platform
              <span className="block mt-2 bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                With Ultimate Precision.
              </span>
            </h1>
            <p className="text-lg leading-relaxed text-slate-400">
              MoneyManage is a secure self-hosted solution for tracking expenses, managing multi-currency budgets, and auditing platform logs. Includes a dedicated Admin console and cross-platform mobile apps.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <Link
                href="/admin/login"
                className="inline-flex h-12 items-center justify-center rounded-xl bg-white px-6 text-sm font-bold text-slate-950 shadow-lg shadow-white/10 transition hover:bg-slate-100"
              >
                Access Admin Portal
              </Link>
              <a
                href="#features"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/60 px-6 text-sm font-semibold text-slate-300 transition hover:border-slate-700 hover:text-white"
              >
                Learn More
              </a>
            </div>
          </div>

          <div className="relative lg:col-span-7">
            <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50 p-2 shadow-2xl shadow-blue-500/5 backdrop-blur-xl">
              <div className="flex items-center gap-2 px-3 pb-3 pt-1 border-b border-slate-800/80">
                <div className="h-3 w-3 rounded-full bg-rose-500/80" />
                <div className="h-3 w-3 rounded-full bg-amber-500/80" />
                <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
                <div className="ml-4 text-xs font-mono text-slate-500">money-manage-admin-v1.0</div>
              </div>
              <Image
                src="/dashboard_mockup.jpg"
                alt="MoneyManage Dashboard Preview"
                width={800}
                height={450}
                priority
                className="rounded-lg object-cover w-full h-auto mt-2"
              />
            </div>
          </div>
        </div>

        {/* KPI metrics row */}
        <div className="mt-24 grid grid-cols-2 gap-6 sm:grid-cols-4 lg:mt-32">
          <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-6 backdrop-blur">
            <p className="text-sm font-medium text-slate-500">Supported Currencies</p>
            <p className="mt-2 text-3xl font-bold text-white">11+</p>
            <p className="mt-1 text-xs text-slate-400">PKR, USD, EUR, GBP, AED...</p>
          </div>
          <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-6 backdrop-blur">
            <p className="text-sm font-medium text-slate-500">Security Architecture</p>
            <p className="mt-2 text-3xl font-bold text-white">Rate-Limit</p>
            <p className="mt-1 text-xs text-slate-400 font-mono">Armed with XSS sanitation</p>
          </div>
          <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-6 backdrop-blur">
            <p className="text-sm font-medium text-slate-500">Sync Frequency</p>
            <p className="mt-2 text-3xl font-bold text-white">Instant</p>
            <p className="mt-1 text-xs text-slate-400">Direct REST API sync</p>
          </div>
          <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-6 backdrop-blur">
            <p className="text-sm font-medium text-slate-500">Admin Privileges</p>
            <p className="mt-2 text-3xl font-bold text-white">RBAC</p>
            <p className="mt-1 text-xs text-slate-400">Role-based Access Controls</p>
          </div>
        </div>

        {/* Features Section */}
        <section id="features" className="pt-28">
          <div className="text-center max-w-3xl mx-auto flex flex-col gap-4">
            <h2 className="text-xs font-semibold tracking-wider text-blue-500 uppercase">Feature Stack</h2>
            <p className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Everything you need to audit and manage finance operations.</p>
            <p className="text-slate-400">We decoupled the mobile and web systems into modular projects, allowing mobile apps to consume the unified web endpoints autonomously.</p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* Card 1 */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8 hover:border-slate-700 transition">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 mb-6 text-xl">
                📊
              </div>
              <h3 className="text-xl font-bold text-white">Admin Operations</h3>
              <p className="mt-3 text-slate-400 leading-relaxed text-sm">
                Analyze total volumes, user accounts, and platform transaction trends through a secure layout.
              </p>
            </div>
            {/* Card 2 */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8 hover:border-slate-700 transition">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 mb-6 text-xl">
                📱
              </div>
              <h3 className="text-xl font-bold text-white">Decoupled Mobile App</h3>
              <p className="mt-3 text-slate-400 leading-relaxed text-sm">
                Runs on Expo and standard iOS/Android, linking directly to Next.js API endpoints. No more complex monorepo dependency loops.
              </p>
            </div>
            {/* Card 3 */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8 hover:border-slate-700 transition">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 mb-6 text-xl">
                🔒
              </div>
              <h3 className="text-xl font-bold text-white">Security Hardened</h3>
              <p className="mt-3 text-slate-400 leading-relaxed text-sm">
                Includes rate limit guards, data sanitization filters, and robust JWT encryption.
              </p>
            </div>
          </div>
        </section>

        {/* Platform Architecture Section */}
        <section id="platform" className="pt-28 border-t border-slate-900/80 mt-20">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div className="flex flex-col gap-6">
              <h2 className="text-xs font-semibold tracking-wider text-blue-500 uppercase">Architecture Highlights</h2>
              <h3 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Decoupled Project Setup</h3>
              <p className="text-slate-400 leading-relaxed">
                By refactoring shared packages into local components (`/src/shared`), both Next.js and Expo build completely independently.
              </p>
              <ul className="space-y-4">
                <li className="flex gap-3 items-start">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <p className="text-sm text-slate-300"><strong>Zero dependency clashes:</strong> Local node_modules resolves without yarn/npm workspaces interference.</p>
                </li>
                <li className="flex gap-3 items-start">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <p className="text-sm text-slate-300"><strong>Easy mobile deployment:</strong> EAS builds compile standard Expo packages seamlessly without referencing root folders.</p>
                </li>
                <li className="flex gap-3 items-start">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <p className="text-sm text-slate-300"><strong>Next.js 16 Web Framework:</strong> Smooth API routing and optimized builds deployed directly on Vercel.</p>
                </li>
              </ul>
            </div>
            
            <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-8 font-mono text-xs text-slate-400 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <span className="text-white font-semibold">📂 Directory Layout</span>
                <span className="text-blue-500">standalone</span>
              </div>
              <div className="space-y-2 leading-relaxed">
                <p><span className="text-indigo-400">moneyManage/</span></p>
                <p>├── <span className="text-blue-400">apps/</span></p>
                <p>│   ├── <span className="text-blue-400">web/</span> <span className="text-slate-500">(Next.js Admin Console & API)</span></p>
                <p>│   │   └── <span className="text-emerald-400">src/shared/</span> <span className="text-slate-500">(Local Shared Schemas)</span></p>
                <p>│   └── <span className="text-blue-400">mobile/</span> <span className="text-slate-500">(Expo React Native App)</span></p>
                <p>│       ├── <span className="text-emerald-400">src/shared/</span> <span className="text-slate-500">(Local Shared Schemas)</span></p>
                <p>│       └── <span className="text-emerald-400">src/api-client/</span> <span className="text-slate-500">(Local client fetcher)</span></p>
                <p>├── <span className="text-slate-500">package.json (Unified runners)</span></p>
                <p>└── <span className="text-slate-500">vercel.json (Build configs)</span></p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-900 bg-slate-950/80 py-12">
        <div className="mx-auto max-w-7xl px-6 md:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <p>© {new Date().getFullYear()} MoneyManage. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/admin/login" className="transition hover:text-slate-300">Admin Console</Link>
            <a href="#features" className="transition hover:text-slate-300">Features</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
