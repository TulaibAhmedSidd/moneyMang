# Monorepo Development Standards & Architecture Rules

Welcome! This document outlines the workspace structure, architectural invariants, developer rules, and list of critical files inside the Expense Tracking & Platform monorepo. Please adhere strictly to these guidelines when making additions or modifications.

---

## 1. Monorepo Workspaces Layout

The project uses `npm workspaces` for package management:
- **`packages/shared`**: Contains centralized data (supported currencies, theme color schemes), Zod validation schemas, and timezone-adjusted calendar bounds utilities.
- **`packages/api-client`**: The SDK wrapper used by frontend projects to call backend APIs.
- **`apps/web`**: Next.js serverless backend, Mongoose database models, administrative control screens, and API endpoints.
- **`apps/mobile`**: React Native Expo mobile application utilizing React Context, TanStack Query, and file-based routing.

---

## 2. Core Architectural Rules (Strict Invariants)

All AI agents and developers MUST respect the following core rules:

### A. Centralized Minor Units Currency Rule
- **Rule**: All currency values stored in the database or transmitted via APIs must represent integer minor units (e.g. cents). Never use float values directly in mutations.
- Pakistan Rupees (PKR) and US Dollars (USD) use factor `10^2` (e.g., `12.50` is sent as `1250`). Japanese Yen (JPY) uses factor `10^0` (e.g., `500` remains `500`).
- **Files**: Use conversions and formatters defined in [`packages/shared/src/utils/money.ts`](file:///d:/ReactProjects/Money/packages/shared/src/utils/money.ts).

### B. Timezone-Adjusted Date Boundaries Rule
- **Rule**: When selecting or summarizing transactions per day/week/month/year, boundary queries must be dynamically adjusted relative to the client's local timezone offset.
- **Files**: Use localized boundary builders (`getLocalDayBounds`, `getLocalMonthBounds`, `getTimezoneOffset`) defined in [`packages/shared/src/utils/dates.ts`](file:///d:/ReactProjects/Money/packages/shared/src/utils/dates.ts).

### C. Stateless Token Revocation & Logout Blocklist
- **Rule**: All protected backend API endpoints must check for revoked session tokens.
- **Files**: Verify sessions using `await verifyAuth(request)` defined in [`apps/web/src/lib/auth.ts`](file:///d:/ReactProjects/Money/apps/web/src/lib/auth.ts). This executes async database lookups against the [`RevokedToken`](file:///d:/ReactProjects/Money/apps/web/src/models/RevokedToken.ts) collection (equipped with automatic TTL index deletion).

### D. Input Sanitization & XSS Safeguards
- **Rule**: All incoming mutation body payloads must be recursively sanitized to strip HTML tags and script elements prior to schema parsing.
- **Files**: Use `sanitizeObject(body)` helper defined in [`apps/web/src/utils/sanitize.ts`](file:///d:/ReactProjects/Money/apps/web/src/utils/sanitize.ts).

### E. Unified Colors Theme Single Source of Truth
- **Rule**: Mobile screens and UI panels must load theme styles dynamically using the single source of truth color tokens defined in the shared package.
- **Files**: Exported theme tokens are stored in [`packages/shared/src/theme/colors.ts`](file:///d:/ReactProjects/Money/packages/shared/src/theme/colors.ts), handled via React Context in [`apps/mobile/app/_layout.tsx`](file:///d:/ReactProjects/Money/apps/mobile/app/_layout.tsx), and called in components via `useTheme()`.

---

## 3. Important Files Map

| Path | Purpose |
| :--- | :--- |
| [`packages/shared/src/theme/colors.ts`](file:///d:/ReactProjects/Money/packages/shared/src/theme/colors.ts) | Single source of truth color tokens for dark/light themes. |
| [`packages/shared/src/utils/money.ts`](file:///d:/ReactProjects/Money/packages/shared/src/utils/money.ts) | Major-to-minor units formatters and currency calculations. |
| [`packages/shared/src/utils/dates.ts`](file:///d:/ReactProjects/Money/packages/shared/src/utils/dates.ts) | Timezone bounds and localized boundary calculations. |
| [`apps/web/src/lib/auth.ts`](file:///d:/ReactProjects/Money/apps/web/src/lib/auth.ts) | JWT signature, async blocklist validations, and RBAC guards. |
| [`apps/web/src/lib/db.ts`](file:///d:/ReactProjects/Money/apps/web/src/lib/db.ts) | Mongoose collection caching and seeder initialization trigger. |
| [`apps/web/src/lib/rateLimit.ts`](file:///d:/ReactProjects/Money/apps/web/src/lib/rateLimit.ts) | Database-backed IP rate limiter protecting sensitive API routes. |
| [`apps/web/src/utils/sanitize.ts`](file:///d:/ReactProjects/Money/apps/web/src/utils/sanitize.ts) | HTML encoding and payload sanitizers. |
| [`apps/mobile/src/components/DonutChart.tsx`](file:///d:/ReactProjects/Money/apps/mobile/src/components/DonutChart.tsx) | SVG-based Expense Category distribution donut chart. |
| [`apps/mobile/src/components/TrendBarChart.tsx`](file:///d:/ReactProjects/Money/apps/mobile/src/components/TrendBarChart.tsx) | SVG-based comparative Bar charts plotting income vs expenses. |
