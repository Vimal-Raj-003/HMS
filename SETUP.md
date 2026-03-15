# Hospital Management System (HMS)

A comprehensive web-based Hospital Management System built with modern technologies.

## 🏥 Features

### Modules
- **Admin Module**: Front desk operations, user management, billing, doctor payouts, reports
- **Doctor Module**: Queue management, consultations, prescriptions, lab orders
- **Nurse Module**: Patient search, vitals recording, queue integration
- **Pharmacy Module**: E-prescriptions, inventory management, dispensing
- **Lab Module**: Test orders, sample collection, results entry
- **Patient Module**: Online booking, medical records, prescriptions access

### Key Features
- 🔐 Role-Based Access Control (RBAC)
- 📱 OTP-based authentication for patients
- 🔄 Real-time queue management with WebSockets
- 💳 Payment integration (Razorpay)
- 📊 Comprehensive reporting
- 🏥 ABDM Compliance (ABHA ID integration)
- 📋 ICD-10 coding for diagnoses
- 🏢 Multi-tenancy support

## 🛠️ Tech Stack

### Backend
- Node.js with Express
- TypeScript
- PostgreSQL with Prisma ORM
- Socket.IO for real-time features
- JWT authentication
- Redis for caching

### Frontend
- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- React Router for navigation
- Zustand for state management
- React Query for server state
- React Hook Form for forms

## 📁 Project Structure

```
├── backend/
│   ├── prisma/
│   │   └── schema.prisma       # Database schema
│   ├── src/
│   │   ├── config/             # Configuration files
│   │   ├── middleware/         # Express middleware
│   │   ├── routes/             # API routes
│   │   ├── services/           # Business logic
│   │   └── index.ts            # Entry point
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── layouts/            # Layout components
│   │   ├── lib/                # Utilities and API
│   │   ├── pages/              # Page components
│   │   │   ├── admin/
│   │   │   ├── doctor/
│   │   │   ├── nurse/
│   │   │   ├── pharmacy/
│   │   │   ├── lab/
│   │   │   └── patient/
│   │   ├── store/              # Zustand stores
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── package.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis (optional, for caching)

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

4. Update the `.env` file with your configuration:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/hms?schema=public"
JWT_SECRET="your-super-secret-jwt-key"
JWT_REFRESH_SECRET="your-refresh-token-secret"
PORT=5000
```

5. Generate Prisma client and create database:
```bash
npx prisma generate
npx prisma db push
```

6. (Optional) Seed the database with initial data:
```bash
npx prisma db seed
```

7. Start the development server:
```bash
npm run dev
```

The API will be available at `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file:
```env
VITE_API_URL=http://localhost:5000
```

4. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## 📚 API Documentation

### Authentication

#### Staff Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@hospital.com",
  "password": "password123"
}
```

#### Patient OTP Login
```http
POST /api/auth/send-otp
Content-Type: application/json

{
  "mobileNumber": "9876543210"
}
```

```http
POST /api/auth/verify-otp
Content-Type: application/json

{
  "mobileNumber": "9876543210",
  "otp": "123456"
}
```

### Common Endpoints

| Module | Endpoint | Description |
|--------|----------|-------------|
| Admin | `/api/admin/dashboard-stats` | Dashboard statistics |
| Admin | `/api/admin/users` | User management |
| Admin | `/api/admin/bills` | Billing management |
| Doctor | `/api/doctor/dashboard-stats` | Doctor dashboard |
| Doctor | `/api/doctor/queue` | Patient queue |
| Doctor | `/api/consultations` | Consultations |
| Nurse | `/api/nurse/dashboard-stats` | Nurse dashboard |
| Nurse | `/api/vitals` | Vitals recording |
| Pharmacy | `/api/pharmacy/dashboard-stats` | Pharmacy dashboard |
| Pharmacy | `/api/pharmacy/prescriptions` | Prescriptions |
| Lab | `/api/lab/dashboard-stats` | Lab dashboard |
| Lab | `/api/lab/orders` | Lab orders |

## 🔐 User Roles

| Role | Access Level |
|------|--------------|
| ADMIN | Full system access |
| DOCTOR | Clinical operations |
| NURSE | Vitals and triage |
| PHARMACIST | Pharmacy operations |
| LAB_TECH | Lab operations |
| RECEPTIONIST | Front desk only |
| PATIENT | Patient portal |

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm run test
```

### Frontend Tests
```bash
cd frontend
npm run test
```

## 📦 Building for Production

### Backend
```bash
cd backend
npm run build
npm start
```

### Frontend
```bash
cd frontend
npm run build
```

The built files will be in the `dist` directory.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, please open an issue in the repository or contact the development team.

---

Built with ❤️ for better healthcare management.
