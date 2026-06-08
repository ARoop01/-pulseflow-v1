import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';

import { initSocket } from './socket.js';

// Route imports
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import doctorRoutes from './routes/doctors.js';
import availabilityRoutes from './routes/availability.js';
import patientRoutes from './routes/patients.js';
import vitalsRoutes from './routes/vitals.js';
import appointmentRoutes from './routes/appointments.js';
import recordRoutes from './routes/records.js';
import symptomRoutes from './routes/symptoms.js';
import consultRoutes from './routes/consults.js';
import telehealthRoutes from './routes/telehealth.js';
import wellnessRoutes from './routes/wellness.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

const corsOrigin = process.env.NODE_ENV === 'production'
  ? true
  : (() => {
      const allowed = (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',').map(o => o.trim());
      return (origin, cb) => {
        if (!origin || allowed.includes(origin)) return cb(null, true);
        cb(new Error(`CORS: origin ${origin} not allowed`));
      };
    })();

app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// ── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/doctors', availabilityRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/vitals', vitalsRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/health-records', recordRoutes);
app.use('/api/symptom-checks', symptomRoutes);
app.use('/api/consult-requests', consultRoutes);
app.use('/api/sessions', telehealthRoutes);
app.use('/api/wellness', wellnessRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'PulseFlow API v1' });
});

// Production: serve built frontend and handle SPA routing
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '../../dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
} else {
  app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
  });
}

// Global error handler
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({ error: err.message || 'Internal server error' });
});

// ── Socket.IO ───────────────────────────────────────────────────────────────
initSocket(httpServer);

// ── Start ───────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`\n🚀 PulseFlow API running on http://localhost:${PORT}`);
  console.log(`📡 Socket.IO ready for real-time connections`);
  console.log(`🗄️  Database: ${process.env.DATABASE_URL}\n`);
});
