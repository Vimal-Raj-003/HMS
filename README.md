# Hospital Management System (HMS)

A comprehensive, full-stack Hospital Management System built with modern web technologies. This system provides role-based access for administrators, doctors, nurses, pharmacists, lab technicians, and patients.

## 🏥 Overview

This HMS is a production-ready, multi-tenant SaaS application designed to manage all aspects of hospital operations including patient registration, appointments, consultations, pharmacy, laboratory, and billing.

## ✨ Features

### Core Modules

| Module | Description | Primary Users |
|--------|-------------|---------------|
| **Admin** | Front desk operations, staff management, billing, reports | Admin Staff, Receptionists |
| **Doctor** | Queue management, consultations, prescriptions, lab orders | Doctors |
| **Nurse** | Patient search, vitals recording, queue integration | Nurses |
| **Pharmacy** | E-prescriptions, inventory management, dispensing, billing | Pharmacists |
| **Lab** | Test orders, sample collection, results entry, reporting | Lab Technicians |
| **Patient** | Online booking, medical records, prescriptions access | Patients |

### Key Features

- 🔐 **Role-Based Access Control (RBAC)** - Granular permissions for all user types
- 📱 **OTP-based Authentication** - Secure mobile verification for patients
- 🔄 **Real-time Updates** - WebSocket-powered queue and notification system
- 💳 **Payment Integration** - Razorpay integration for online payments
- 📊 **Comprehensive Reporting** - Detailed analytics and reports
- 🏥 **Multi-Tenancy** - SaaS-ready architecture with hospital isolation
- 📋 **ICD-10 Coding** - Standardized diagnosis coding
- 🔔 **Real-time Notifications** - In-app notification system with bell icon

## 🛠️ Tech Stack

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js + Express | Server runtime and framework |
| TypeScript | Type-safe JavaScript |
| PostgreSQL | Relational database |
| Prisma ORM | Database toolkit and ORM |
| Socket.IO | Real-time bidirectional communication |
| JWT | Authentication tokens |
| Redis | Caching and session management |
| Multer | File upload handling |
| Nodemailer | Email services |
| Zod | Schema validation |

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18 | UI library |
| TypeScript | Type-safe JavaScript |
| Vite | Build tool and dev server |
| Tailwind CSS | Utility-first CSS framework |
| React Router v6 | Client-side routing |
| Zustand | State management |
| TanStack Query | Server state management |
| React Hook Form | Form handling |
| Recharts | Charting library |
| Lucide React | Icon library |
| Socket.IO Client | Real-time communication |
| Axios | HTTP client |

## 📁 Project Structure

```
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # Database schema
│   │   └── migrations/            # Database migrations
│   ├── src/
│   │   ├── config/
│   │   │   └── database.ts        # Database configuration
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts # Authentication & authorization
│   │   │   ├── error.middleware.ts # Error handling
│   │   │   └── tenant.middleware.ts # Multi-tenancy support
│   │   ├── routes/
│   │   │   ├── admin.routes.ts    # Admin endpoints
│   │   │   ├── appointment.routes.ts
│   │   │   ├── auth.routes.ts     # Authentication endpoints
│   │   │   ├── billing.routes.ts
│   │   │   ├── doctor.routes.ts
│   │   │   ├── lab.routes.ts
│   │   │   ├── nurse.routes.ts
│   │   │   ├── notification.routes.ts
│   │   │   ├── patient.routes.ts
│   │   │   ├── patientPortal.routes.ts
│   │   │   ├── pharmacy.routes.ts
│   │   │   └── queue.routes.ts
│   │   ├── services/
│   │   │   ├── auth.service.ts
│   │   │   └── patient.service.ts
│   │   ├── index.ts               # Application entry point
│   │   ├── socket.ts              # Socket.IO handlers
│   │   └── seed.ts                # Database seeding
│   ├── .env.example
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── patient/
│   │   │   │   └── PrescriptionModal.tsx
│   │   │   ├── ui/
│   │   │   │   ├── CollapsibleCard.tsx
│   │   │   │   ├── DataTable.tsx
│   │   │   │   ├── DocumentViewer.tsx
│   │   │   │   ├── MiniChart.tsx
│   │   │   │   ├── Skeleton.tsx
│   │   │   │   ├── StatCard.tsx
│   │   │   │   └── index.ts
│   │   │   └── NotificationBell.tsx
│   │   ├── contexts/
│   │   │   └── ThemeContext.tsx
│   │   ├── layouts/
│   │   │   ├── AuthLayout.tsx
│   │   │   └── DashboardLayout.tsx
│   │   ├── lib/
│   │   │   ├── api.ts             # API client
│   │   │   ├── socket.ts          # Socket client
│   │   │   └── utils.ts
│   │   ├── pages/
│   │   │   ├── admin/
│   │   │   │   ├── Appointments.tsx
│   │   │   │   ├── Billing.tsx
│   │   │   │   ├── Dashboard.tsx
│   │   │   │   ├── PatientRegistration.tsx
│   │   │   │   ├── QueueManagement.tsx
│   │   │   │   ├── Reports.tsx
│   │   │   │   ├── Settings.tsx
│   │   │   │   └── StaffManagement.tsx
│   │   │   ├── auth/
│   │   │   │   ├── Login.tsx
│   │   │   │   └── PatientLogin.tsx
│   │   │   ├── doctor/
│   │   │   │   ├── Consultation.tsx
│   │   │   │   ├── Dashboard.tsx
│   │   │   │   ├── PatientQueue.tsx
│   │   │   │   ├── Prescriptions.tsx
│   │   │   │   └── Schedule.tsx
│   │   │   ├── lab/
│   │   │   │   ├── Dashboard.tsx
│   │   │   │   ├── EnterResults.tsx
│   │   │   │   ├── LabOrders.tsx
│   │   │   │   ├── SampleCollection.tsx
│   │   │   │   └── TestCatalog.tsx
│   │   │   ├── landing/
│   │   │   │   ├── LandingPage.tsx
│   │   │   │   └── components/
│   │   │   │       ├── ChatBot.tsx
│   │   │   │       ├── DoctorsSection.tsx
│   │   │   │       ├── ECGWaveBackground.tsx
│   │   │   │       ├── FAQSection.tsx
│   │   │   │       ├── FooterSection.tsx
│   │   │   │       ├── HeroSection.tsx
│   │   │   │       ├── MetricsSection.tsx
│   │   │   │       ├── SpecialtiesSection.tsx
│   │   │   │       ├── TestimonialsSection.tsx
│   │   │   │       └── TrustSection.tsx
│   │   │   ├── nurse/
│   │   │   │   ├── Dashboard.tsx
│   │   │   │   ├── PatientSearch.tsx
│   │   │   │   └── RecordVitals.tsx
│   │   │   ├── patient/
│   │   │   │   ├── BookAppointment.tsx
│   │   │   │   ├── Dashboard.tsx
│   │   │   │   ├── LabReports.tsx
│   │   │   │   ├── MedicalRecords.tsx
│   │   │   │   ├── MyPrescriptions.tsx
│   │   │   │   ├── Profile.tsx
│   │   │   │   └── ProfileSetup.tsx
│   │   │   └── pharmacy/
│   │   │       ├── Bills.tsx
│   │   │       ├── Dashboard.tsx
│   │   │       ├── DispenseMedicine.tsx
│   │   │       ├── Expenses.tsx
│   │   │       ├── Inventory.tsx
│   │   │       ├── ManualBilling.tsx
│   │   │       ├── PendingPrescriptions.tsx
│   │   │       └── Reports.tsx
│   │   ├── store/
│   │   │   └── auth.store.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── .env.example
│   ├── vercel.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── package.json
├── docker-compose.yml
├── render.yaml
├── SETUP.md
├── HOSTINGER-DEPLOYMENT.md
└── Module Specifications
    ├── Admin-Module.md
    ├── Architecture-Enhancements.md
    ├── Doctor-Module.md
    ├── Lab-Module.md
    ├── Nurse-Module.md
    ├── Patient-Module.md
    └── Pharmacy-Module.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis (optional, for caching)

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your configuration:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/hms?schema=public"
   JWT_SECRET="your-super-secret-jwt-key"
   JWT_REFRESH_SECRET="your-refresh-token-secret"
   PORT=5000
   NODE_ENV=development
   ```

4. **Initialize database:**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Seed database (optional):**
   ```bash
   npm run db:seed
   ```

6. **Start development server:**
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env`:
   ```env
   VITE_API_URL=http://localhost:5000
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5173`

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new staff user (Admin only) |
| POST | `/api/auth/login` | Staff login |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/send-otp` | Send OTP to patient mobile |
| POST | `/api/auth/verify-otp` | Verify patient OTP |

### Module Endpoints

#### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/dashboard-stats` | Dashboard statistics |
| GET | `/api/admin/users` | List all users |
| POST | `/api/admin/users` | Create user |
| PUT | `/api/admin/users/:id` | Update user |
| GET | `/api/admin/bills` | List bills |
| GET | `/api/admin/reports` | Generate reports |

#### Doctor
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/doctors/dashboard-stats` | Doctor dashboard stats |
| GET | `/api/doctors/queue` | Patient queue |
| GET | `/api/doctors/consultations` | Consultation history |
| POST | `/api/doctors/consultations` | Create consultation |
| POST | `/api/doctors/prescriptions` | Create prescription |
| POST | `/api/doctors/lab-orders` | Order lab tests |

#### Nurse
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/nurse/dashboard-stats` | Nurse dashboard stats |
| GET | `/api/nurse/patients/search` | Search patients |
| POST | `/api/nurse/vitals` | Record patient vitals |
| GET | `/api/nurse/vitals/:patientId` | Get patient vitals history |

#### Pharmacy
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/pharmacy/dashboard-stats` | Pharmacy dashboard |
| GET | `/api/pharmacy/prescriptions` | List pending prescriptions |
| POST | `/api/pharmacy/dispense` | Dispense medicines |
| GET | `/api/pharmacy/inventory` | List inventory |
| PUT | `/api/pharmacy/inventory/:id` | Update inventory |
| GET | `/api/pharmacy/bills` | Pharmacy bills |
| POST | `/api/pharmacy/bills` | Create manual bill |

#### Lab
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/lab/dashboard-stats` | Lab dashboard stats |
| GET | `/api/lab/orders` | List lab orders |
| PUT | `/api/lab/orders/:id/sample` | Collect sample |
| PUT | `/api/lab/orders/:id/results` | Enter results |
| GET | `/api/lab/catalog` | Test catalog |
| POST | `/api/lab/catalog` | Add test to catalog |

#### Patient Portal
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/patient/doctors` | List available doctors |
| GET | `/api/patient/doctors/:id/slots` | Get doctor slots |
| POST | `/api/patient/appointments` | Book appointment |
| GET | `/api/patient/records` | Medical records |
| GET | `/api/patient/prescriptions` | My prescriptions |
| GET | `/api/patient/lab-reports` | Lab reports |

### Queue Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/queue` | Get queue status |
| POST | `/api/queue` | Add to queue |
| PUT | `/api/queue/:id/status` | Update queue status |
| POST | `/api/queue/:id/hold` | Put on hold |
| POST | `/api/queue/:id/skip` | Skip patient |

## 🔐 User Roles & Permissions

| Role | Description | Access |
|------|-------------|--------|
| `ADMIN` | System administrator | Full system access |
| `DOCTOR` | Medical professional | Clinical operations, consultations, prescriptions |
| `NURSE` | Nursing staff | Vitals recording, patient search |
| `PHARMACIST` | Pharmacy staff | Inventory, dispensing, pharmacy billing |
| `LAB_TECH` | Laboratory technician | Lab orders, sample collection, results |
| `RECEPTIONIST` | Front desk staff | Patient registration, appointments |
| `PATIENT` | Registered patient | Patient portal, booking, records |

## 🗄️ Database Schema

### Core Tables

| Table | Description |
|-------|-------------|
| `hospitals` | Multi-tenant hospital/tenant data |
| `users` | Staff accounts (doctors, nurses, admins, etc.) |
| `patients` | Patient demographics and profiles |
| `appointments` | Booked appointments |
| `queue_entries` | Daily token queue |

### Clinical Tables

| Table | Description |
|-------|-------------|
| `vitals` | Patient vital signs |
| `consultations` | Doctor consultation records |
| `prescriptions` | Medicine prescriptions |
| `prescription_items` | Individual medicines in prescriptions |
| `medical_history` | Pre-existing conditions |

### Lab Tables

| Table | Description |
|-------|-------------|
| `lab_tests` | Test master catalog |
| `lab_orders` | Test orders |
| `lab_order_items` | Individual test results |
| `lab_samples` | Sample collection tracking |
| `lab_billings` | Lab billing records |

### Pharmacy Tables

| Table | Description |
|-------|-------------|
| `medicines` | Medicine master data |
| `inventory` | Stock levels and tracking |
| `pharmacy_dispenses` | Dispense records |
| `pharmacy_bills` | Pharmacy invoices |
| `pharmacy_expenses` | Expense tracking |

### Billing Tables

| Table | Description |
|-------|-------------|
| `bills` | Invoices |
| `bill_items` | Invoice line items |
| `payments` | Payment records |
| `master_bills` | Consolidated billing |

### System Tables

| Table | Description |
|-------|-------------|
| `notifications` | User notifications |
| `audit_logs` | Activity tracking |
| `refresh_tokens` | JWT refresh tokens |
| `icd10_codes` | ICD-10 diagnosis codes |

## 🔄 Real-time Events (Socket.IO)

### Events Emitted by Server

| Event | Description |
|-------|-------------|
| `queue:update` | Queue status changed |
| `notification:new` | New notification for user |
| `prescription:new` | New prescription created |
| `lab:result_ready` | Lab results available |
| `lab:order_new` | New lab order created |

### Socket Connection

```typescript
// Frontend
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000', {
  auth: { token: accessToken }
});

socket.on('queue:update', (data) => {
  console.log('Queue updated:', data);
});
```

## 🏗️ Architecture

### Multi-Tenancy

The system supports multi-tenancy through:
- Hospital-based data isolation
- Subdomain routing (e.g., `cityhospital.hms.com`)
- Tenant middleware for automatic context injection

### Event-Driven Design

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Doctor    │────▶│   Socket    │────▶│  Pharmacy   │
│  Consultation│    │    Server   │     │  Dashboard  │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │  Patient    │
                    │  Notification│
                    └─────────────┘
```

## 📦 Deployment

### Docker Deployment

```bash
docker-compose up -d
```

### Manual Deployment

**Backend:**
```bash
cd backend
npm run build
npm start
```

**Frontend:**
```bash
cd frontend
npm run build
# Serve the dist folder
```

### Cloud Deployment

- **Backend**: Configured for Render (see `render.yaml`)
- **Frontend**: Configured for Vercel (see `frontend/vercel.json`)

For detailed deployment instructions, see:
- [SETUP.md](./SETUP.md) - Complete setup guide
- [HOSTINGER-DEPLOYMENT.md](./HOSTINGER-DEPLOYMENT.md) - Hostinger deployment

## 🧪 Development

### Available Scripts

**Backend:**
```bash
npm run dev        # Start development server with hot reload
npm run build      # Build for production
npm start          # Start production server
npm run db:generate # Generate Prisma client
npm run db:push    # Push schema changes
npm run db:migrate # Run migrations
npm run db:studio  # Open Prisma Studio
npm run db:seed    # Seed database
```

**Frontend:**
```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
npm run lint       # Run ESLint
```

## 📖 Module Specifications

Detailed specifications for each module are available:

| Module | Document |
|--------|----------|
| Doctor | [Doctor-Module.md](./Doctor-Module.md) |
| Patient | [Patient-Module.md](./Patient-Module.md) |
| Admin | [Admin-Module.md](./Admin-Module.md) |
| Nurse | [Nurse-Module.md](./Nurse-Module.md) |
| Pharmacy | [Pharmacy-Module.md](./Pharmacy-Module.md) |
| Lab | [Lab-Module.md](./Lab-Module.md) |
| Architecture | [Architecture-Enhancements.md](./Architecture-Enhancements.md) |

## 🔒 Security

- **Authentication**: JWT-based with refresh token rotation
- **Authorization**: Role-based access control (RBAC)
- **Data Validation**: Zod schemas on backend, React Hook Form + Zod on frontend
- **Password Hashing**: bcryptjs
- **CORS**: Configured for allowed origins only
- **File Uploads**: Validated file types and size limits

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, please open an issue in the repository.

---

Built with ❤️ for better healthcare management.
