# MoneyManage 💸

MoneyManage is a premium, localized, ad-free personal finance tracker designed to give users complete control over their budgets. It features real-time cloud synchronization, visual analytics, timezone-aligned calendar logs, and a unified experience across Web and Mobile.

---

## 🚀 Core Features

### 1. Zero-Lag Local Caching
- If connection is slow or offline, inputs (transactions, categories) save to the browser's `localStorage` instantly.
- A floating glassmorphic status indicator in the top right shows active sync states (`Saving locally...`, `Syncing to cloud`, `Synced with cloud`) once a connection is detected.

### 2. Deep Personalization
- **Vibrant Accent Themes**: Choose from 5 custom accent themes (Blue, Emerald, Violet, Rose, Amber) that update layouts, headers, and UI triggers in real time.
- **Custom Categories**: Create, select, and customize categories with your own emoji icons and hex colors.

### 3. Localized Currency Formatting
- Multi-currency wallets matching your preferences.
- **No Decimals**: Clean layouts strip trailing `.00` decimals globally.
- **Urdu Spellings & Abbreviations**: The dashboard automatically displays spoken Roman Urdu numbers (e.g. `13 lac 84 hazar 91`) alongside Western abbreviations (`1.38M`) below your primary balance indicator.

### 4. Interactive Calendars & Charts
- Visual breakdown share of expenses with SVG donut charts.
- Timezone-aligned calendar layouts grouping financial history correctly.

### 5. Spreadsheet Export
- Range-based spreadsheet exporter allowing users to download UTF-8-BOM protected CSV transaction logs compatible with Microsoft Excel and Google Sheets.

---

## 🛠️ Tech Stack & Architecture

- **Backend**: Next.js App Router API endpoints, Mongoose schema controllers, MongoDB Atlas database.
- **Frontend Portal**: React 19 Client components, Tailwind CSS styling, native SVGs.
- **Mobile Companion**: Expo Router (React Native) bare workspace utilizing shared business logic.
- **Database Migration**: Decrypts and un-obfuscates SQLite `.mmbackup` database packages to map historical data accurately while preserving manual entries.

---

## 📲 Setup & Installation

### Web Portal:
1. Initialize development server:
   ```bash
   npm run dev
   ```
2. Build and optimize static static pages:
   ```bash
   npm run build
   ```

### Mobile App:
1. Synchronize package dependencies:
   ```bash
   npm install
   ```
2. Compile and assemble local Android debug/release APK files:
   ```bash
   npx eas build --platform android --profile preview
   ```
