import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-zinc-950 font-sans text-slate-100 selection:bg-blue-500 selection:text-white">
      {/* Background Blurs */}
      <div className="absolute top-0 left-1/4 h-[500px] w-[500px] rounded-full bg-blue-500/10 blur-[120px]" />
      <div className="absolute top-1/4 right-1/4 h-[600px] w-[600px] rounded-full bg-indigo-500/10 blur-[150px]" />
      <div className="absolute bottom-10 left-1/3 h-[500px] w-[500px] rounded-full bg-purple-500/10 blur-[130px]" />

      {/* Navigation Header */}
      <header className="relative z-10 mx-auto max-w-7xl px-6 py-6 md:px-8">
        <div className="flex items-center justify-between border-b border-zinc-900/60 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30">
              <span className="text-xl font-bold text-white">M</span>
            </div>
            <span className="text-xl font-extrabold tracking-tight text-white">MoneyManage</span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <a href="#features" className="transition hover:text-white">Core Features</a>
            <a href="#customization" className="transition hover:text-white">Customization</a>
            <a href="#pwa" className="transition hover:text-white">PWA Install</a>
          </nav>

          <div className="flex items-center gap-4">
            <Link
              href="/portal/login"
              className="text-sm font-semibold text-slate-300 hover:text-white transition"
            >
              Sign In
            </Link>
            <Link
              href="/portal/register"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/10 transition hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Register Free
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 mx-auto max-w-7xl px-6 pt-16 pb-24 sm:pt-20 md:px-8">
        <div className="grid gap-16 lg:grid-cols-12 lg:items-center">
          
          {/* Hero details */}
          <div className="flex flex-col gap-6 lg:col-span-5">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/5 px-3.5 py-1 text-xs font-semibold tracking-wider text-blue-400 uppercase">
              ✨ Ad-Free Personal Finance
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl lg:leading-[1.1]">
              Manage budgets
              <span className="block mt-2 bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                Completely Ad-Free.
              </span>
            </h1>
            <p className="text-lg leading-relaxed text-slate-400">
              Take control of your cash flow with MoneyManage. Create custom categories, choose your own theme colors, track metrics globally in multiple currencies, and install it on any device. 100% private, secure, and built for consumers.
            </p>
            
            <div className="flex flex-wrap gap-4 pt-2">
              <Link
                href="/portal/register"
                className="inline-flex h-12 items-center justify-center rounded-xl bg-white px-6 text-sm font-bold text-slate-950 shadow-lg shadow-white/10 transition hover:bg-slate-100"
              >
                Create Free Account
              </Link>
              <Link
                href="/portal/login"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/60 px-6 text-sm font-semibold text-slate-300 transition hover:border-zinc-700 hover:text-white"
              >
                Sign In to Portal
              </Link>
            </div>
          </div>

          {/* Hero graphics columns */}
          <div className="relative lg:col-span-7 grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
            
            {/* Desktop Dashboard Preview */}
            <div className="relative sm:col-span-8 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50 p-2 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center gap-1.5 px-3 pb-3 pt-1 border-b border-zinc-850">
                <div className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
                <div className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
                <span className="ml-3 text-[10px] font-mono text-slate-500">money-manage-portal</span>
              </div>
              <Image
                src="/dashboard_mockup.jpg"
                alt="MoneyManage Dashboard Preview"
                width={500}
                height={280}
                priority
                className="rounded-lg object-cover w-full h-auto mt-2"
              />
            </div>

            {/* Mobile App Customization Preview */}
            <div className="relative sm:col-span-4 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50 p-2 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center gap-1.5 px-3 pb-3 pt-1 border-b border-zinc-850">
                <span className="text-[10px] font-mono text-slate-500">mobile-app-mockup</span>
              </div>
              <Image
                src="/mobile_mockup.jpg"
                alt="MoneyManage Mobile Preview"
                width={250}
                height={333}
                priority
                className="rounded-lg object-cover w-full h-auto mt-2"
              />
            </div>

          </div>
        </div>

        {/* Highlight points row */}
        <div className="mt-24 grid grid-cols-2 gap-6 sm:grid-cols-4 lg:mt-32">
          <div className="rounded-2xl border border-zinc-900 bg-zinc-900/20 p-6 backdrop-blur">
            <div className="text-xl">🚫</div>
            <p className="mt-3 text-sm font-bold text-white">100% Ad-Free</p>
            <p className="mt-1 text-xs text-slate-400">Zero banners, zero track scripts, full privacy.</p>
          </div>
          <div className="rounded-2xl border border-zinc-900 bg-zinc-900/20 p-6 backdrop-blur">
            <div className="text-xl">🏷️</div>
            <p className="mt-3 text-sm font-bold text-white">Own Categories</p>
            <p className="mt-1 text-xs text-slate-400">Add custom labels and assign custom emojis/icons.</p>
          </div>
          <div className="rounded-2xl border border-zinc-900 bg-zinc-900/20 p-6 backdrop-blur">
            <div className="text-xl">🎨</div>
            <p className="mt-3 text-sm font-bold text-white">Full Theme Control</p>
            <p className="mt-1 text-xs text-slate-400">Switch color modes, timezones, and display units.</p>
          </div>
          <div className="rounded-2xl border border-zinc-900 bg-zinc-900/20 p-6 backdrop-blur">
            <div className="text-xl">📲</div>
            <p className="mt-3 text-sm font-bold text-white">PWA & Native App</p>
            <p className="mt-1 text-xs text-slate-400">Save to your home screen instantly on iOS & Android.</p>
          </div>
        </div>

        {/* Feature breakdown section */}
        <section id="features" className="pt-28">
          <div className="text-center max-w-3xl mx-auto flex flex-col gap-4">
            <h2 className="text-xs font-semibold tracking-wider text-blue-500 uppercase">Core Platform Features</h2>
            <p className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Simplify your budget management.</p>
            <p className="text-slate-400">Get visual analytics, structured calendars, and transaction control over multiple currency wallets.</p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* Feat 1 */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8 hover:border-zinc-700 transition">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 mb-6 text-xl">
                📈
              </div>
              <h3 className="text-xl font-bold text-white">Visual Analytics</h3>
              <p className="mt-3 text-slate-400 leading-relaxed text-sm">
                Understand where your money goes. Natively rendered SVG donut and trend bar charts track category distributions and daily flows.
              </p>
            </div>
            {/* Feat 2 */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8 hover:border-zinc-700 transition">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 mb-6 text-xl">
                📅
              </div>
              <h3 className="text-xl font-bold text-white">Interactive Calendar</h3>
              <p className="mt-3 text-slate-400 leading-relaxed text-sm">
                Audit monthly activities in a clean calendar grid. Days with transactions display indicator bullets so you can easily review logs day-by-day.
              </p>
            </div>
            {/* Feat 3 */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8 hover:border-zinc-700 transition">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 mb-6 text-xl">
                💱
              </div>
              <h3 className="text-xl font-bold text-white">Multi-Currency Wallets</h3>
              <p className="mt-3 text-slate-400 leading-relaxed text-sm">
                Full multi-currency formatting support (PKR, USD, EUR, etc.) matching your profile settings automatically.
              </p>
            </div>
          </div>
        </section>

        {/* Customization Focus */}
        <section id="customization" className="pt-28 border-t border-zinc-900/80 mt-20">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div className="flex flex-col gap-6">
              <h2 className="text-xs font-semibold tracking-wider text-blue-500 uppercase">Ultimate Personalization</h2>
              <h3 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Custom categories & visual themes</h3>
              <p className="text-slate-400 leading-relaxed">
                MoneyManage is built to adjust to your workflow. Add your own accounts (cash, savings, bank cards) and create personalized categories with specific icons.
              </p>
              <ul className="space-y-4 text-sm text-slate-300">
                <li className="flex gap-3 items-start">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <p><strong>Custom Categories:</strong> Set up transaction categories for dining, coffee, bills, or entertainment.</p>
                </li>
                <li className="flex gap-3 items-start">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <p><strong>Select Themes & Currencies:</strong> Select preference presets for timezone logging, display currencies, and dark background modes.</p>
                </li>
                <li className="flex gap-3 items-start">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <p><strong>Offline Capabilities:</strong> Standalone Service Worker saves static app files in your cache so pages load instantaneously.</p>
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-zinc-850 bg-zinc-900/20 p-8 space-y-4">
              <h4 className="text-sm font-bold text-white pb-3 border-b border-zinc-850">🛠️ Profile Customization Mockup</h4>
              <div className="space-y-3.5 text-xs">
                <div className="flex justify-between items-center bg-zinc-900/40 p-3 rounded-xl border border-zinc-850">
                  <span className="text-slate-400">Display Currency</span>
                  <span className="font-bold text-white bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-lg border border-blue-500/20">PKR - Rs.</span>
                </div>
                <div className="flex justify-between items-center bg-zinc-900/40 p-3 rounded-xl border border-zinc-850">
                  <span className="text-slate-400">Custom Category</span>
                  <span className="font-bold text-white bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-lg border border-indigo-500/20">🍔 Fast Food</span>
                </div>
                <div className="flex justify-between items-center bg-zinc-900/40 p-3 rounded-xl border border-zinc-850">
                  <span className="text-slate-400">Active Timezone</span>
                  <span className="font-semibold text-slate-300">Asia/Karachi</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PWA download guide */}
        <section id="pwa" className="pt-28 text-center max-w-4xl mx-auto flex flex-col gap-6">
          <h2 className="text-xs font-semibold tracking-wider text-blue-500 uppercase">Progressive Web App</h2>
          <h3 className="text-3xl font-extrabold text-white sm:text-4xl">Install on your Home Screen in 2 seconds</h3>
          <p className="text-slate-400 leading-relaxed max-w-2xl mx-auto">
            Install MoneyManage directly from your web browser as a Progressive Web App (PWA). Works seamlessly on iOS, Android, and Desktop.
          </p>

          <div className="grid gap-6 sm:grid-cols-3 text-left mt-8">
            <div className="border border-zinc-900 bg-zinc-900/20 p-6 rounded-2xl">
              <span className="text-lg">🤖</span>
              <h4 className="font-bold text-white mt-3 text-sm">Android (Chrome)</h4>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">Click the three dots in Chrome ➔ select "Install app" or "Add to Home screen".</p>
            </div>
            <div className="border border-zinc-900 bg-zinc-900/20 p-6 rounded-2xl">
              <span className="text-lg">🍎</span>
              <h4 className="font-bold text-white mt-3 text-sm">iOS Safari (iPhone)</h4>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">Tap the Share icon ➔ scroll down and select "Add to Home Screen".</p>
            </div>
            <div className="border border-zinc-900 bg-zinc-900/20 p-6 rounded-2xl">
              <span className="text-lg">💻</span>
              <h4 className="font-bold text-white mt-3 text-sm">Desktop (Chrome/Edge)</h4>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">Click the monitor icon in the address bar ➔ click "Install".</p>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="pt-28 text-center max-w-3xl mx-auto flex flex-col gap-6 pb-20">
          <h3 className="text-3xl font-extrabold text-white">Start tracking today</h3>
          <p className="text-slate-400 text-sm">Create an account in 10 seconds. Completely ad-free and free to use.</p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/portal/register"
              className="inline-flex h-12 items-center justify-center rounded-xl bg-blue-600 px-6 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-500"
            >
              Sign Up Free
            </Link>
            <Link
              href="/portal/login"
              className="inline-flex h-12 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/60 px-6 text-sm font-semibold text-slate-300 transition hover:border-zinc-700 hover:text-white"
            >
              Sign In
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-zinc-900 bg-zinc-950/80 py-12">
        <div className="mx-auto max-w-7xl px-6 md:px-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-sm text-slate-500">
          <p>© {new Date().getFullYear()} MoneyManage. All rights reserved.</p>
          <div className="flex flex-wrap gap-6 justify-center">
            <Link href="/portal/login" className="transition hover:text-slate-300">Consumer Portal</Link>
            <Link href="/admin/login" className="transition hover:text-slate-300">Operator Console</Link>
            <a href="#features" className="transition hover:text-slate-300 font-medium">Core Features</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
