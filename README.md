<div align="center">
  <h1>🏥 ContinuumCare</h1>
  <p><strong>A Smart Wearable Health Monitoring & Care Management System</strong></p>

  [![React](https://img.shields.io/badge/React-19.2.4-blue.svg)](https://reactjs.org/)
  [![Vite](https://img.shields.io/badge/Vite-8.0.1-purple.svg)](https://vitejs.dev/)
  [![Supabase](https://img.shields.io/badge/Supabase-Database_&_Auth-green.svg)](https://supabase.com/)
  [![Role-Based Access Control](https://img.shields.io/badge/Security-Strict_RBAC%20&%20RLS-red.svg)]()
  [![Tailwind CSS](https://img.shields.io/badge/Styling-Custom_CSS-orange.svg)]()
</div>

---

## 📖 Overview

**ContinuumCare** is a full-stack, production-quality AI-powered hospice and home-care management platform. It provides a secure, scalable, and user-friendly ecosystem for unified patient health records, continuous caregiver monitoring, early health deterioration detection, and seamless care coordination.

Designed to eliminate gaps in patient monitoring, ContinuumCare enables Doctors, Nurses, and Family members to coordinate care through a shared, real-time platform.

## ✨ Key Features

### 🔐 Enterprise-Grade Security (RBAC & RLS)
- **Strict Role-Based Access Control (RBAC):** Distinct interfaces and capabilities for Doctors, Nurses, and Family Members.
- **Row-Level Security (RLS):** Implemented directly at the PostgreSQL database level natively via Supabase to ensure true data isolation.
- **Audit Logging:** Every critical action and report download is tracked to ensure compliance.

### 🩺 Advanced Clinical Management
- **Unified Patient Profiles:** Centralized repository for patient demographics, medical history, allergies, and care assignments.
- **Smart Vitals Logging:** Nurses can record vital signs (BP, Temp, O₂, Heart Rate) accurately with an integrated interface.
- **Automated Health Alerts:** The system actively monitors logged vitals against safe thresholds. If anomalies are detected, active alerts (Warning, Critical) are auto-generated.
- **Medication Management:** Doctors can prescribe medication, tracking dosage, frequencies, and log administrations. 

### 💊 Smart Pharmacy & Cost Optimization
- **Generic Alternative Suggestions:** An internal composition-matching engine analyzes doctor-prescribed medications and automatically suggests fully equivalent and similarly composed generic alternatives to significantly reduce out-of-pocket costs.
- **Geolocation-Based Price Comparison:** Calculates the Haversine distance from the patient to display nearby pharmacies ranked by real-time medicine availability and pricing. Shop local and cheap.
- **Monthly Cost Estimator:** Intelligently parses prescription frequencies (e.g., "1-0-1", "Twice daily") to extrapolate an accurate 30-day supply cost.

### 👨‍👩‍👧‍👦 Family Coordination
- **Automated Invitation System:** Nurses and doctors can seamlessly invite family members via email (powered by SendGrid & Supabase Edge Functions).
- **Dedicated Family Portal:** A read-only dashboard allowing families to monitor vitals, review active alerts, and ensure complete transparency—strictly limited to their assigned patient.

### 📄 Medical Reporting
- **PDF Report Generation:** One-click generation of comprehensive medical reports compiling demographics, visit history, active alerts, prescriptions, and lab results.
- **Diagnostic Tracking:** Book appointments and securely upload/store laboratory reports via Supabase Storage.

---

## 🛠️ Tech Stack

### Frontend Architecture
- **React 19** & **Vite 8** — Core rendering and blazing-fast build tooling.
- **React Router v7** — Seamless client-side routing.
- **Recharts** — Dynamic visualization of patient vitals over time.
- **Lucide React** — Beautiful, consistent iconography.
- **jsPDF & html2canvas** — Client-side medical report generation.

### Backend & Infrastructure
- **Supabase** — The unified backend alternative:
  - **PostgreSQL Database** — Complex relational data modeling.
  - **Supabase Auth** — JWT-based authentication perfectly merged with Data Policies.
  - **Real-time Subscriptions** — WebSockets natively broadcasting data changes.
  - **Supabase Storage** — Secure storage for medical reports and files.
- **Deno Edge Functions** — Serverless execution for integrations like the SendGrid Family Invite system.

---

## 👥 Roles and Permissions

| Feature                 | 👨‍⚕️ Doctor (Admin) | 👩‍⚕️ Nurse (Staff) | 👨‍👩‍👧 Family (Viewer) |
| :---------------------- | :----------------: | :--------------: | :------------------: |
| **All Patients Access** |         ✅         |        ✅        |          ❌          |
| **Assigned Patient Data**|         ✅         |        ✅        |          ✅          |
| **Log Vitals / Visits** |         ✅         |        ✅        |          ❌          |
| **Manage Medications**  |         ✅         |        ❌        |          ❌          |
| **Smart Pharmacy Engine**|         ✅         |        ❌        |          ✅          |
| **View/Resolve Alerts** |         ✅         |        ✅        |     ✅ (View Only)   |
| **Download PDF Reports**|         ✅         |        ✅        |     ✅ (Own Patient) |
| **Invite Family**       |         ✅         |        ✅        |          ❌          |

---

## 📂 Project Structure

```text
ContinuumCare/
├── src/
│   ├── components/         # Reusable UI components (Sidebar, Modals, Forms)
│   ├── config/             # Configuration (e.g., rbacConfig.js)
│   ├── contexts/           # Global React Contexts (AuthContext)
│   ├── lib/                # Library initializations (Supabase client)
│   ├── pages/              # Primary Route Views (Dashboard, Profiles, Login)
│   ├── services/           # Abstraction layer for DB Queries & integrations
│   ├── styles/             # Modular CSS styling directives
│   ├── utils/              # Helper functions and calculators
│   ├── App.jsx             # React Application Router
│   └── main.jsx            # Entry point
├── supabase/
│   ├── functions/          # Deno Edge functions (SendGrid Invite service)
│   ├── supabase_schema.sql # Complete database DDL schema
│   ├── rbac_policies.sql   # Supabase RLS security policies
│   └── family_invites_schema.sql # Specific schema for the invite engine
├── docs/                   # Detailed feature documentation
├── package.json            # Project Manifest and Dependencies
└── vite.config.js          # Vite Build Configuration
```

---

## 🚀 Setup & Installation Guide

### Prerequisites
1. **Node.js**: v18 or later.
2. **Supabase Account**: A fresh project on [supabase.com](https://supabase.com).
3. **SendGrid Account**: (Required if testing the email invitations via Edge Functions).

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/ContinuumCare.git
cd ContinuumCare
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env.local` file at the root of the project with your Supabase credentials:
```env
VITE_SUPABASE_URL=https://your-project-url.supabase.co
VITE_SUPABASE_ANON_KEY=your-project-anon-key
```

### 4. Database Initialization
1. Navigate to the **SQL Editor** in your Supabase Dashboard.
2. Copy the contents of `supabase/supabase_schema.sql` and run the script to generate all core tables and database triggers.
3. Once completed, execute `supabase/rbac_policies.sql` to strictly enforce Role-Based Access Control and Row Level Security.
4. Execute `supabase/family_invites_schema.sql` to apply the family invite tables.
5. Execute `supabase/seed_pharmacy_data.sql` to populate the Smart Pharmacy databases (medicines, pharmacies, and pricing).
6. In Supabase Authentication settings, ensure **Email/Password sign-up is enabled**.

### 5. Running Locally
Start your local Vite development server:
```bash
npm run dev
```
The application will launch on `http://localhost:5173`. Any changes will instantly trigger Hot Module Replacement (HMR).

---

## ☁️ Deployming Edge Functions (Email Invites)

To deploy the send-invite logic, you need the Supabase CLI installed.
```bash
# Login to Supabase CLI
npx supabase login

# Link your project
npx supabase link --project-ref your-project-ref

# Set production environment variables securely inside supabase
npx supabase secrets set SENDGRID_API_KEY=your_sendgrid_key
npx supabase secrets set SENDER_EMAIL=your_verified_sender@email.com

# Deploy the function
npx supabase functions deploy send-invite
```

---

## 🛡️ Known Limitations & Future Roadmap

* **Wearable Integration Pending (v2.0):** Native integration for consumer-grade wearables to push automated vitals data payload directly to the `/visits` table API.
* **Predictive AI Engine:** Expanding the base vitals alerts to deploy Machine Learning patterns for anomaly detection before humans catch it.

---

<div align="center">
  <p>Built as a rigorous engineering project pushing the boundaries of HealthTech Web Development.</p>
</div>
