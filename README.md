# PulseFlow — Telehealth Platform Simulator

A full-stack telehealth simulation platform built for India. PulseFlow lets you experience both sides of a medical consultation — as a **Patient** and as a **Physician** — in real time, from the same browser.

---

## Live Demo

> Frontend hosted on **Vercel** · Backend on **Render** · Database on **PostgreSQL**

**Demo credentials (auto-loaded on launch):**
- Patient: `alex@pulseflow.in` / `pulseflow123`
- Doctor: `sharma@apollo.in` / `pulseflow123`

---

## Features

### Patient App
- **Dashboard** — Live vitals chart (heart rate, BP, sleep, steps), upcoming appointments, quick-action cards
- **Symptom Analyst** — Select symptoms to get a severity score, diagnosis probability, and department recommendation
- **Consult Scheduler** — Browse 9 verified specialists across Cardiology, Neurology, Pediatrics, General Health, and Psychiatry. Book date/time slots
- **Rapido Mode** — Dispatch an instant live telehealth request to a doctor with real-time biometric snapshot
- **Video Booth** — Simulated telehealth session with in-session chat
- **Health Locker** — Secure medical records cabinet (lab reports, prescriptions, vaccines). Upload or receive doctor-issued records
- **Wellness Hub** — Guided box breathing timer and daily hydration tracker

### Physician App
- **Physician Console** — Live queue of incoming Rapido consult requests with patient biometric snapshots
- Accept / Decline incoming consult requests in real time
- Issue prescriptions at the end of a session (auto-saved to patient's Health Locker)
- Full appointment calendar view

### Platform
- **Dual Simulator** — Toggle between Patient and Physician views in the same window to simulate both apps simultaneously
- **Real-time sync** via Socket.IO — consult dispatches, session starts, and chat are live
- Dark / Light theme toggle
- JWT authentication with auto login for the demo session

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 8 |
| Backend | Node.js, Express 4, Socket.IO 4 |
| Database | PostgreSQL via Prisma ORM |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| Real-time | Socket.IO (WebSockets) |
| Hosting | Vercel (frontend) + Render (backend + DB) |

---

## Project Structure

```
pulseflow-v1/
├── src/                        # React frontend
│   ├── components/
│   │   ├── Dashboard.jsx       # Patient & doctor dashboards
│   │   ├── SymptomChecker.jsx  # Symptom analysis engine
│   │   ├── Scheduler.jsx       # Appointment booking
│   │   ├── Telehealth.jsx      # Video booth + chat
│   │   ├── HealthLocker.jsx    # Medical records
│   │   ├── WellnessToolkit.jsx # Breathing & hydration
│   │   └── Onboarding.jsx      # Registration flow
│   ├── lib/
│   │   ├── api.js              # Fetch wrapper with JWT auth
│   │   └── socket.js           # Socket.IO client
│   └── App.jsx                 # Root layout + simulator control panel
│
├── server/                     # Express backend
│   ├── src/
│   │   ├── index.js            # App entry, middleware, routes
│   │   ├── socket.js           # Socket.IO event handlers
│   │   ├── routes/             # REST API routes
│   │   └── middleware/         # JWT auth, file upload
│   └── prisma/
│       ├── schema.prisma       # Database schema (15 models)
│       └── seed.js             # Demo data (9 doctors, patient, records)
│
├── render.yaml                 # Render Blueprint (backend + PostgreSQL)
└── vercel.json                 # Vercel SPA routing config
```

---

## Running Locally

### Prerequisites
- Node.js 18+
- A PostgreSQL database (or use SQLite for quick local dev — see note below)

### 1. Clone the repo
```bash
git clone https://github.com/ARoop01/pulseflow-v1.git
cd pulseflow-v1
```

### 2. Install dependencies
```bash
# Frontend
npm install

# Backend
cd server && npm install
```

### 3. Configure the backend
```bash
cp server/.env.example server/.env
```
Edit `server/.env` and set your `DATABASE_URL`.

> **Quick local option:** Change `provider = "postgresql"` back to `"sqlite"` in `server/prisma/schema.prisma` and set `DATABASE_URL="file:./prisma/dev.db"` to run without a PostgreSQL server.

### 4. Set up the database
```bash
cd server
npx prisma db push
node prisma/seed.js
```

### 5. Start both servers
```bash
# From the project root — starts frontend + backend together
npm run dev:all
```

Frontend → `http://localhost:5173`
Backend API → `http://localhost:3001`

---

## Deployment

This project is configured for **Vercel (frontend) + Render (backend + PostgreSQL)**.

### Backend — Render
1. Go to [render.com](https://render.com) → **New → Blueprint**
2. Connect this GitHub repo — Render auto-detects `render.yaml`
3. It creates a **Web Service** (`pulseflow-api`) + a **PostgreSQL** database
4. After deploy, go to the service **Environment** settings and add:
   ```
   CORS_ORIGIN = https://your-vercel-app.vercel.app
   ```

### Frontend — Vercel
1. Go to [vercel.com](https://vercel.com) → **New Project** → import this repo
2. Add an **Environment Variable**:
   ```
   VITE_API_URL = https://pulseflow-api.onrender.com
   ```
3. Deploy — Vercel auto-detects the Vite build config

---

## API Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register patient or doctor |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/doctors` | List all doctors with availability |
| GET | `/api/patients/me` | Authenticated patient profile |
| GET/POST | `/api/appointments` | Book and list appointments |
| GET/POST | `/api/health-records` | Manage health records |
| POST | `/api/consult-requests` | Dispatch a Rapido consult |
| POST | `/api/sessions/:id/end` | End telehealth session, issue prescription |
| GET | `/api/vitals` | Patient vitals for chart |

### Socket.IO Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `consult:request` | Patient → Server | Dispatch instant consult |
| `consult:incoming` | Server → Doctor | Notify doctor of new request |
| `consult:accept` | Doctor → Server | Accept and create session |
| `session:started` | Server → Both | Session is live |
| `chat:message` | Both ↔ Server | In-session chat |
| `session:ended` | Either → Server | End session |

---

## Seeded Demo Data

| | |
|-|-|
| **Demo Patient** | Alex Rivera — IT Developer, O-Positive, hereditary BP & Diabetes |
| **Doctors** | 9 specialists across Apollo, Fortis, Max, Medanta, Rainbow hospitals |
| **Specialties** | Cardiology (2), Neurology (2), Pediatrics (2), General Health (2), Psychiatry (1) |
| **Health Records** | ECG report, Pfizer booster certificate, Lipid profile panel |
| **Appointment** | Pre-booked with Dr. Rajesh Sharma — Cardiology, Apollo Hospital Delhi |

---

## License

MIT
