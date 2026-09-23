import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://money-mang.vercel.app"),
  title: {
    default: "MoneyManage — Personal Finance & Budget Tracker",
    template: "%s | MoneyManage",
  },
  description:
    "Private, lightning-fast, ad-free personal finance tracker and budget manager with instant offline caching, custom categories, and multi-currency metrics.",
  applicationName: "MoneyManage",
  authors: [{ name: "MoneyManage Team" }],
  generator: "Next.js",
  keywords: [
    "personal finance",
    "budget tracker",
    "expense manager",
    "money management app",
    "ad-free budget app",
    "offline finance tracker",
    "PWA finance",
    "cash flow tracker",
    "multi-currency wallet",
    "financial analytics",
  ],
  creator: "MoneyManage",
  publisher: "MoneyManage",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "https://money-mang.vercel.app",
  },
  openGraph: {
    title: "MoneyManage — Elite Personal Finance & Budget Tracker",
    description:
      "Take complete control of your finances with MoneyManage. 100% ad-free, instant offline syncing, custom categories, and interactive financial analytics.",
    url: "https://money-mang.vercel.app",
    siteName: "MoneyManage",
    images: [
      {
        url: "/dashboard_mockup.jpg",
        width: 1200,
        height: 630,
        alt: "MoneyManage Financial Dashboard Preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MoneyManage — Elite Personal Finance Tracker",
    description: "Manage budgets, track expenses, and view visual analytics in an ad-free, secure PWA.",
    images: ["/dashboard_mockup.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon.svg", sizes: "192x192", type: "image/svg+xml" },
      { url: "/icon.svg", sizes: "512x512", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/icon.svg", sizes: "180x180", type: "image/svg+xml" },
    ],
    shortcut: "/icon.svg",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FinancialApplication",
    name: "MoneyManage",
    url: "https://money-mang.vercel.app",
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web, iOS, Android, macOS, Windows",
    description: "Secure, ad-free personal finance tracker and budget management platform with offline PWA capabilities.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    featureList: [
      "Instant offline transaction logging",
      "Dynamic multi-currency support",
      "Custom categorization with custom colors and icons",
      "Spending analytics with category breakdown and monthly comparison",
      "Financial calendar overview",
      "Zero advertisements, completely consumer-centric",
    ],
  };

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2563eb" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="MoneyManage" />
        <link rel="apple-touch-icon" href="/icon.svg" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        
        {/* Schema.org JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(reg) { console.log('SW registered:', reg.scope); })
                    .catch(function(err) { console.error('SW registration failed:', err); });
                });
              }
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">{children}</body>
    </html>
  );
}
