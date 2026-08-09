import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-100 py-16">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-6 sm:px-10">
        <section className="grid gap-10 rounded-[2rem] bg-white p-10 shadow-[0_24px_80px_rgba(15,23,42,0.08)] md:grid-cols-[1.25fr_0.75fr] md:items-center md:gap-12">
          <div className="space-y-6">
            <p className="inline-flex rounded-full bg-blue-100 px-4 py-1 text-sm font-semibold text-blue-700">
              Personal finance made simple
            </p>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Track budgets, manage spending, and control your cash flow.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-slate-600">
              Money gives your team a clean dashboard for budgets, expenses, analytics, and secure admin controls.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/admin/login"
                className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Admin login
              </Link>
              <a
                href="#features"
                className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-400"
              >
                Explore features
              </a>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-900 via-blue-700 to-cyan-600 p-8 text-white shadow-xl">
            <div className="rounded-[1.75rem] bg-slate-950/10 p-8 backdrop-blur-xl">
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">Money platform</p>
              <h2 className="mt-4 text-3xl font-bold">Smart spending, smarter saving.</h2>
              <p className="mt-4 text-sm leading-6 text-slate-200">
                Real-time budgeting, expense tracking, analytics, and admin workflows for modern finance teams.
              </p>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl bg-white/10 p-5">
                  <p className="text-lg font-semibold text-white">10k+</p>
                  <p className="mt-1 text-sm text-slate-200">Transactions processed monthly</p>
                </div>
                <div className="rounded-3xl bg-white/10 p-5">
                  <p className="text-lg font-semibold text-white">Secure admin</p>
                  <p className="mt-1 text-sm text-slate-200">Role-based controls and protected dashboards.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Analytics",
              description: "Visualize income vs expenses and stay ahead of your money goals.",
            },
            {
              title: "Budget control",
              description: "Group expenses into categories, set budgets, and review progress instantly.",
            },
            {
              title: "Admin management",
              description: "Secure admin access, user management, and audit-ready controls.",
            },
          ].map((feature) => (
            <div key={feature.title} className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <h3 className="text-xl font-semibold text-slate-900">{feature.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{feature.description}</p>
            </div>
          ))}
        </section>

        <section className="rounded-[2rem] bg-slate-900 px-10 py-12 text-white shadow-[0_40px_80px_rgba(15,23,42,0.18)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Launch your finance app</p>
              <h2 className="mt-4 text-3xl font-bold">One place to manage money, users, and admin workflows.</h2>
            </div>
            <Link
              href="/admin/login"
              className="inline-flex items-center justify-center rounded-2xl bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
            >
              Access admin portal
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
