# MoneyManage Platform

A Global Personal Finance and Expense Tracking Platform. Built as a secure, high-performance monorepo workspace containing a Next.js serverless backend, a React Native Expo mobile client, and a shared API client.

---

## 1. Monorepo Structure

- **`apps/web`**: Next.js serverless backend API, database schemas, and administrative control console.
- **`apps/mobile`**: React Native Expo app leveraging TanStack Query, SecureStore authentication, and lightweight SVG comparative charts.
- **`packages/shared`**: Shared Zod validation schemas, timezone-shifting calculators, and normalized integer minor-unit money converters.
- **`packages/api-client`**: SDK class package to fetch data type-safely.

---

## 2. Installation & Quick Start

### Prerequisites
- **Node.js**: `v22.11.0` or higher
- **npm**: `10.9.0` or higher

### Local Setup
1. Clone the repository and navigate to the project directory:
   ```bash
   git clone https://github.com/TulaibAhmedSidd/moneyManage.git
   cd moneyManage
   ```
2. Install dependencies at the workspace root (this links workspaces automatically):
   ```bash
   npm install
   ```
3. Set up the environment file. Create `apps/web/.env` and insert your secrets:
   ```env

---

## 3. Running the Applications Locally

### A. Run Backend & Web (Next.js)
Start the Next.js development server:
```bash
npm run dev -w apps/web
```
The API is available at `http://localhost:3000`.

### B. Run Mobile App (Expo)
Start the Expo Metro bundler:
```bash
npm run dev -w apps/mobile
```
- Download the **Expo Go** application on your mobile device.
- Scan the QR code displayed in your terminal. Note: both your computer and phone must be connected to the **same Wi-Fi network**.

---

## 4. Administrative Features (Admin Console)

### Accessing the Admin Panel
1. The Admin Dashboard is located at `/admin` (e.g. `http://localhost:3000/admin`).
2. Log in with a user possessing `ADMIN` or `SUPER_ADMIN` credentials.
3. Access:
   - **Dashboard**: Global system statistics, active user percentages, total transaction volume in minor units, and live transaction log trackers.
   - **User Management**: Search registered users, pagination pages, update roles, and suspend/activate user login permissions in real-time.

---

## 5. Deployment Guide

### A. Backend Deployment (Vercel)
1. Go to [Vercel](https://vercel.com) and import your Git repository.
2. Select `apps/web` as the root directory.
3. Set the Environment Variables (`MONGO_URI`, `JWT_SECRET`, `SMTP_EMAIL`, `SMTP_PASSWORD`) in the Project Settings.
4. Click **Deploy**. Vercel will handle building and hosting automatically.

### B. Standalone Mobile App Build (Expo EAS)
1. Install Expo EAS CLI:
   ```bash
   npm install -g eas-cli
   ```
2. Log in to Expo and build:
   ```bash
   cd apps/mobile
   eas login
   eas build --platform android --profile preview
   ```
This will compile an installable `.apk` file for your Android device.

---

## 6. Development Rules & Standards

For details on architecture design rules, dynamic timezone offsets, minor units conversions, payload input XSS sanitizers, and shared theme color systems, refer to [`standards.md`](./standards.md).
