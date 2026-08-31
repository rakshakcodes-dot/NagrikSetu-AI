# 🏛️ NagrikSetu - Goa Civic & Pothole Grievance Portal

> **A modern, responsive civic grievance and road hazard monitoring platform tailored for citizens and Goa Public Works Department (PWD) / Municipal officers.**

[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-19.x-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-4.x-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase Ready](https://img.shields.io/badge/Database-Supabase%20PostgreSQL-3ECF8E?style=flat&logo=supabase&logoColor=white)](https://supabase.com/)

---

## 🌟 Key Features

### 👤 Citizen Portal
- **GPS-Assisted Complaint Reporting**: Submit potholes and road defects with photo evidence, live geolocation auto-detect, road surface selection, and urgency categorization.
- **Smart Identity Scoping**: New citizen IDs start with a clean personal ticket history, with seamless one-click switching to browse Goa-wide public complaints.
- **Visual Status Timeline**: Track reported grievances through **Pending Verification → Assigned to Division → In Progress (Contractor Deployed) → Resolved (Paved & Sealed)**.
- **Public Grievance Explorer**: Filter tickets across 8 Goa talukas (Panaji, Margao, Mapusa, Vasco, Ponda, Bicholim, Quepem, Canacona).
- **Multi-language Support**: Full English and Hindi (हिंदी) localization.

### 🛡️ Officer Portal (Goa PWD Clearance)
- **Security PIN Authorization**: Protected by a 4-digit municipal security PIN (Default: `1234`), with in-portal PIN changing and instant reset tools.
- **Interactive Municipal Map**: Live heatmaps, ward clusters, priority badges, and quick-dispatch actions across Goa coordinates.
- **Triage & Contractor Dispatch**: Assign complaints to contractors, update target completion dates, and manage municipal work orders.
- **Municipal Analytics**: Real-time SLA tracking, ward-by-ward metrics, resolution velocity, and contractor performance logs.

---

## 📂 Project Structure

```
├── .github/
│   └── workflows/
│       └── deploy.yml        # Automated GitHub Actions deployment to GitHub Pages
├── src/
│   ├── components/           # UI components (Citizen, Officer, Map, Analytics, Modals)
│   │   ├── CitizenDashboard.tsx
│   │   ├── OfficerDashboard.tsx
│   │   ├── OfficerPinModal.tsx
│   │   ├── OfficerPinSettingsModal.tsx
│   │   ├── ComplaintDetails.tsx
│   │   ├── ComplaintMap.tsx
│   │   ├── AnalyticsView.tsx
│   │   ├── SubmitComplaint.tsx
│   │   ├── LoginRegister.tsx
│   │   └── ...
│   ├── data/                 # Sample municipal complaints, mock users, Goa divisions
│   ├── lib/                  # Supabase client and connection utilities
│   ├── services/             # Supabase data layer and fallback synchronization
│   ├── utils/                # Translations (EN/HI), PIN storage helpers
│   ├── types.ts              # TypeScript interfaces and domain models
│   ├── App.tsx               # Main application controller
│   ├── main.tsx              # React DOM entry point
│   └── index.css             # Tailwind CSS global styles
├── supabase-schema.sql       # PostgreSQL table schemas, indexes, and RLS rules
├── server.ts                 # Full-stack Node.js / Express proxy server
├── vite.config.ts            # Vite configuration with relative base paths for GitHub Pages
├── tsconfig.json             # TypeScript compiler settings
├── package.json              # NPM dependencies and scripts
└── .env.example              # Environment variables template
```

---

## 🚀 Quick Start Guide

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18 or 20+ recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/) or [pnpm](https://pnpm.io/)

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
cd YOUR_REPOSITORY
```

### 2. Install dependencies
```bash
npm install
```

### 3. Setup environment variables (Optional for Supabase)
Copy the example environment configuration:
```bash
cp .env.example .env
```
*(The app works with built-in realistic mock data out-of-the-box if Supabase keys are not provided).*

### 4. Run development server
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:3000`.

---

## 🌐 Hosting on GitHub Pages (Fixing Blank Screen)

If you see a **blank white screen** on GitHub Pages, it is usually because GitHub Pages is set to serve raw source files (`/`) instead of building with GitHub Actions.

### Easy Fix:
1. Go to your repository on **GitHub** → **Settings** → **Pages**.
2. Under **Build and deployment** → **Source**, change the dropdown from **"Deploy from a branch"** to **"GitHub Actions"**.
3. Push any commit or go to the **Actions** tab and click **Run workflow** on `Deploy NagrikSetu to GitHub Pages`.
4. Wait ~1 minute for the green checkmark — your site will load properly with all styles and scripts!

### Why this happens:
- Browsers cannot run raw TypeScript/JSX files directly (`src/main.tsx`).
- Setting the Source to **GitHub Actions** tells GitHub to execute `npm run build` (Vite) and publish the compiled static production bundle (`dist/`), complete with `.nojekyll` and relative `./` asset paths.

---

## ☁️ Alternative Free Deployment Options

### ⚡ Vercel
1. Import your GitHub repository into [Vercel](https://vercel.com).
2. Framework Preset: **Vite**.
3. Build Command: `npm run build` or `npx vite build`.
4. Output Directory: `dist`.
5. Click **Deploy**.

### 🍃 Netlify
1. Connect your repository to [Netlify](https://netlify.com).
2. Build command: `npx vite build`.
3. Publish directory: `dist`.
4. Click **Deploy Site**.

---

## 🗄️ Database Setup (Supabase PostgreSQL)

To enable live persistence across all devices:
1. Create a free project at [Supabase.com](https://supabase.com).
2. Open the **SQL Editor** in your Supabase dashboard.
3. Paste and run the queries inside [`supabase-schema.sql`](./supabase-schema.sql).
4. Add your Supabase credentials to `.env` or GitHub Secrets:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-public-key
   ```

---

## 🔐 Officer Security PIN Clearance
- **Default Officer PIN**: `1234`
- **PIN Customization**: Officers can change or reset their 4-digit PIN directly from the Officer Control Desk or the bottom left sidebar menu.

---

## 📜 License
This project is open-source and available under the **MIT License**.
