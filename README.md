# ResolveIQ — AICTE Complaint Intelligence & Resolution Platform

> **Tagline:** Intelligent Complaints. Transparent Resolution.

ResolveIQ is a centralized complaint-management and intelligence platform designed for an AICTE-oriented hackathon prototype. It empowers students to register institutional grievances, equips authorized bureau officers to investigate and resolve cases, and provides Super Administrators with system-wide oversight, cross-bureau related-case detection, and Institution 360° analytics.

---

## 🌟 Key Capabilities & Distinguishing Features

1. **Cross-Bureau Related-Complaint Intelligence**:
   - Local TF-IDF n-gram vectorization and cosine similarity matching.
   - Detects systemic issues (e.g., unauthorized fees and harassment) filed across different bureaus.
   - Officers review explainable similarity reasons and confirm/reject relationships (`CONFIRMED_RELATED`, `DUPLICATE`, `NOT_RELATED`).

2. **Institution 360° Profiles**:
   - Consolidated single-pane view of an educational institution's grievance history.
   - Status distribution, 12-month filing trends, category breakdown, open escalations, and official resolution orders.
   - Upholds due process by distinguishing raw allegations from investigated outcomes.

3. **Bureau & Cell Performance Monitoring Matrix**:
   - Searchable, sortable matrix comparing workload and SLA resolution rates across AICTE bureaus.
   - Drill-down modal inspecting the exact complaints contributing to any bureau's numbers.
   - Instant CSV export for reporting.

4. **Local Rule-Based & AI Classification**:
   - Offline, privacy-preserving classification into 8 grievance domains.
   - Suggests the responsible AICTE bureau with explainable match signals.
   - Investigating officers can review, accept, or override AI recommendations.

5. **Deadline Monitoring, Escalation, & Tamper-Evident Audit Trail**:
   - Automated background daemon calculates SLA breach dates and flags overdue complaints.
   - Dedicated Overdue Escalation Queue in the Assignment Center.
   - Append-only audit log tracking every login, assignment, status transition, and resolution.

---

## 🏗️ Architecture

```
resolveiq/
├── frontend/               # React + Vite + TypeScript + Tailwind CSS
│   ├── src/
│   │   ├── components/ui/  # Reusable UI system (Modal, Badges, KPICard, Timeline, Toasts)
│   │   ├── features/auth/  # AuthContext, Role-based ProtectedRoute
│   │   ├── layouts/        # StudentLayout, OfficerLayout, AdminLayout
│   │   ├── pages/
│   │   │   ├── public/     # Landing, Login, Register, ForgotPassword, AccessDenied, 404
│   │   │   ├── student/    # Dashboard, SubmitComplaint, MyComplaints, ComplaintDetail
│   │   │   ├── officer/    # Dashboard, ComplaintQueue, ComplaintWorkspace
│   │   │   └── admin/      # Dashboard, BureauMonitoring, AssignmentCenter, Institution360,
│   │   │                   # UserManagement, InstitutionManagement, Analytics, AuditLogs, Settings
│   │   ├── services/       # Typed API clients (Axios)
│   │   └── utils/          # Formatters, status colors, helpers
├── backend/                # Node.js + Express + MySQL 8 REST API
│   ├── migrations/         # 001_initial_schema.sql (24 normalized tables)
│   ├── seeds/              # seed.js (Deterministic demo dataset)
│   ├── src/
│   │   ├── config/         # MySQL connection pool, JWT utilities
│   │   ├── controllers/    # API request handlers
│   │   ├── middleware/     # JWT authentication, role authorization, error handler, rate limit
│   │   ├── routes/         # Modular Express REST endpoints
│   │   ├── services/       # Business logic (complaints, audit, notifications, AI bridge)
│   │   └── jobs/           # Scheduled deadline and SLA monitoring daemon
│   └── tests/              # Jest + Supertest integration test suite (36 tests)
└── ai-service/             # Local Python FastAPI AI Microservice
    ├── app/                # Classifier, TF-IDF Similarity engine, Preprocessor, Schemas
    └── tests/              # Pytest test suite (14 tests)
```

---

## 📋 Demo Credentials

All seed accounts are pre-configured with active workloads, complaint histories, and relationships:

| Role | Email | Password | Assigned Bureau |
|------|-------|----------|-----------------|
| **Super Admin** | `super_admin@resolveiq.demo` | `Admin@123456` | All Bureaus & Cells |
| **Bureau Officer** | `officer1@resolveiq.demo` | `Officer@123` | Academic Affairs Bureau |
| **Bureau Officer** | `officer2@resolveiq.demo` | `Officer@123` | Fee & Finance Bureau |
| **Bureau Officer** | `officer3@resolveiq.demo` | `Officer@123` | Examination Bureau |
| **Bureau Officer** | `officer4@resolveiq.demo` | `Officer@123` | Student Welfare Bureau |
| **Bureau Officer** | `officer5@resolveiq.demo` | `Officer@123` | Infrastructure Bureau |
| **Student** | `student1@resolveiq.demo` | `Student@123` | Delhi Tech. Institute |
| **Student** | `student2@resolveiq.demo` | `Student@123` | Mumbai College of Sci. |
| **Student** | `student3@resolveiq.demo` | `Student@123` | Bangalore Univ. |

---

## 🚀 Setup & Installation Guide

### Prerequisites
- **Node.js** v18+ and **npm**
- **Python** 3.10+
- **MySQL Server** 8.0+

---

### Step 1: Database Setup & Migration

1. In MySQL, ensure the database exists or run the migration script:
```bash
# In MySQL command line or shell:
mysql -u root -p < backend/migrations/001_initial_schema.sql
```

2. Seed the deterministic fictional demo dataset:
```bash
cd backend
npm run seed
```

---

### Step 2: Backend API Configuration & Launch

1. Configure `.env` in `backend/` (or update existing):
```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_NAME=resolveiq_db
DB_USER=root
DB_PASSWORD=your_mysql_password
JWT_SECRET=resolveiq_dev_jwt_secret_change_in_production_32chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=resolveiq_dev_refresh_secret_change_in_prod_32chars
JWT_REFRESH_EXPIRES_IN=7d
UPLOAD_DIR=uploads
MAX_FILE_SIZE=10485760
AI_SERVICE_URL=http://localhost:8000
CORS_ORIGIN=http://localhost:5173
```

2. Start the Backend API:
```bash
cd backend
npm start
# Or for live-reloading development:
npm run dev
```
Backend API runs at: `http://localhost:5000` (Health check: `http://localhost:5000/api/health`)

---

### Step 3: Local AI Microservice Launch

1. Install Python dependencies:
```bash
cd ai-service
pip install -r requirements.txt
```

2. Start the AI service:
```bash
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
AI Service runs at: `http://localhost:8000` (Docs & Swagger: `http://localhost:8000/docs`)

---

### Step 4: Frontend Web Application Launch

1. Install dependencies & start Vite dev server:
```bash
cd frontend
npm run dev
```
Frontend runs at: `http://localhost:5173`

---

## 🧪 Automated Testing

### Backend Integration Tests (Jest & Supertest)
Runs 36 comprehensive tests covering authentication, role-based authorization, valid and invalid status transitions, student isolation, and live MySQL analytics aggregations:
```bash
cd backend
npm test
```
*Result: 3 test suites passed, 36/36 tests passed.*

### AI Service Tests (Pytest)
Runs 14 tests validating keyword categorization, threshold sensitivity, and TF-IDF cosine similarity ranking:
```bash
cd ai-service
python -m pytest
```
*Result: 14/14 tests passed.*

### Frontend Production Build
Validates TypeScript typings, component exports, and asset bundling:
```bash
cd frontend
npm run build
```
*Result: Vite build completed with 0 errors.*

---

## ⚖️ Ethical & Technical Safeguards

- **AI Advises, Humans Decide**: The AI engine provides suggestions; officers must confirm classifications and case linkages.
- **Explainable Scores**: Match scores are rule-and-vector similarity indicators, never presented as calibrated certainty.
- **Air-Gapped & Local**: No external cloud LLM dependencies or paid API keys required.
- **Tamper-Evident History**: Status changes, assignments, and resolution findings are recorded in immutable audit logs.
- **Prototype Disclaimer**: Fictional demo dataset clearly labeled; not affiliated with official live government servers.

