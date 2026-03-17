import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

// Import routes
import authRoutes from './routes/auth.routes';
import patientRoutes from './routes/patient.routes';
import patientPortalRoutes from './routes/patientPortal.routes';
import doctorRoutes from './routes/doctor.routes';
import nurseRoutes from './routes/nurse.routes';
import adminRoutes from './routes/admin.routes';
import pharmacyRoutes from './routes/pharmacy.routes';
import labRoutes from './routes/lab.routes';
import appointmentRoutes from './routes/appointment.routes';
import queueRoutes from './routes/queue.routes';
import billingRoutes from './routes/billing.routes';
import notificationRoutes from './routes/notification.routes';

// Import middleware
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { tenantMiddleware } from './middleware/tenant.middleware';

// Import socket handler
import { initializeSocket } from './socket';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Parse allowed origins from environment (comma-separated for multiple domains)
const allowedOrigins = process.env.FRONTEND_URL 
  ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
  : ['http://localhost:3000'];

// Socket.IO configuration
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  // Production optimizations
  ...(process.env.NODE_ENV === 'production' && {
    pingTimeout: 60000,
    pingInterval: 25000,
  }),
});

// Initialize Socket.IO
initializeSocket(io);

// CORS configuration
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    // Use exact origin matching only (no substring matching to prevent bypass attacks)
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Tenant middleware for multi-tenancy
app.use(tenantMiddleware);

// Health check (important for Render/other cloud providers)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/patient', patientPortalRoutes);  // Patient portal routes (for logged-in patients)
app.use('/api/doctors', doctorRoutes);
app.use('/api/nurse', nurseRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/pharmacy', pharmacyRoutes);
app.use('/api/lab', labRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/notifications', notificationRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`🚀 HMS Server running on port ${PORT}`);
  console.log(`📡 Socket.IO enabled`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔒 Allowed origins: ${allowedOrigins.join(', ')}`);
});

export { io };
