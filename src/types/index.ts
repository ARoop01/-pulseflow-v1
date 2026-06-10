// Core domain types for PulseFlow — shared across components and API calls

// ── Auth ─────────────────────────────────────────────────────────────────────

export type UserRole = 'PATIENT' | 'DOCTOR';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  profileId: string | null;
}

// ── Patient ──────────────────────────────────────────────────────────────────

export interface PatientIntake {
  occupation: string;
  workHoursWeekly: number;
  workExertion: 'Sedentary' | 'Moderate' | 'Highly Active';
  personalHistory: string;
  hereditary?: string[];
  exposures?: string[];
  bloodType?: string;
}

// ── Doctor ───────────────────────────────────────────────────────────────────

export type Specialty =
  | 'General Health'
  | 'Cardiology'
  | 'Neurology'
  | 'Pediatrics'
  | 'Psychiatry'
  | 'Dermatology'
  | 'Orthopedics';

export interface Doctor {
  id: string;
  name: string;
  specialty: Specialty | string;
  qualification: string;
  workplace: string;
  location: string;
  feeInr: number;
  experienceYears: number;
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  isOnline: boolean;
  avatarUrl: string | null;
}

// ── Appointments ─────────────────────────────────────────────────────────────

export type AppointmentStatus = 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

export interface Appointment {
  id: string; // confirmation code e.g. "PF-123456"
  doctor?: {
    id: string;
    name: string;
    specialty: string;
    avatar: string | null;
    qualification: string;
    workplace: string;
    fee: string;
  };
  date: string;
  slot: string;
  type: string;
  status: AppointmentStatus;
}

// ── Vitals ───────────────────────────────────────────────────────────────────

export interface VitalsEntry {
  id: string;
  recordedAt: string;
  heartRateBpm: number | null;
  systolicBp: number | null;
  diastolicBp: number | null;
  sleepHours: number | null;
  dailySteps: number | null;
}

// ── Health Records ───────────────────────────────────────────────────────────

export type RecordCategory = 'Prescriptions' | 'Lab Reports' | 'Vaccines';

export interface HealthRecord {
  id: string; // REC-XXXXX
  title: string;
  category: RecordCategory;
  doctor: string | null;
  date: string;
  desc: string;
  fileUrl: string | null;
  source: 'DOCTOR_ISSUED' | 'SELF_UPLOADED';
}

// ── Symptom Checker ──────────────────────────────────────────────────────────

export interface Symptom {
  id: string;
  label: string;
  emoji: string;
  dept?: string;
}

export type UrgencyLevel = 'routine' | 'urgent' | 'emergency';

export interface DiagnosisResult {
  sessionId: string;
  condition: string;
  prob: number;
  recommendedDept: Specialty | string;
  advice: string;
  urgencyLevel: UrgencyLevel;
  aiPowered: boolean;
}

// ── ConsultNow (Rapido) ──────────────────────────────────────────────────────

export type ConsultStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'TIMEOUT';

export interface ConsultRequest {
  requestId: string;
  token: string;
  status: ConsultStatus;
}

// ── Socket.IO Event Payloads ─────────────────────────────────────────────────

export interface SocketConsultRequest {
  token: string;
  specialty: Specialty | string;
  patientName: string;
  symptoms: string[];
  medicalIntake?: Partial<PatientIntake>;
}

export interface SocketConsultIncoming {
  token: string;
  patientName: string;
  symptoms: string[];
  medicalIntake?: Partial<PatientIntake>;
  specialty: string;
}

export interface SocketSessionStarted {
  sessionId: string;
  doctorName: string;
  doctorAvatar: string | null;
}

export interface SocketChatMessage {
  id: string;
  sessionId: string;
  text: string;
  senderRole: 'PATIENT' | 'DOCTOR';
  sentAt: string;
}

export interface ClientToServerEvents {
  'doctor:join': (data: { doctorId: string }) => void;
  'consult:request': (data: SocketConsultRequest) => void;
  'consult:accept': (data: { token: string; doctorId: string; doctorName: string; doctorAvatar: string | null }) => void;
  'consult:decline': (data: { token: string }) => void;
  'chat:message': (data: { sessionId: string; text: string; senderRole: 'PATIENT' | 'DOCTOR'; senderId: string; token: string }) => void;
  'session:ended': (data: { sessionId: string; token: string }) => void;
}

export interface ServerToClientEvents {
  'consult:incoming': (data: SocketConsultIncoming) => void;
  'consult:taken': (data: { token: string }) => void;
  'consult:declined': (data: { token: string }) => void;
  'consult:timeout': (data: { token: string }) => void;
  'consult:no_doctors': (data: { specialty: string }) => void;
  'session:started': (data: SocketSessionStarted) => void;
  'session:ended': (data: { sessionId: string }) => void;
  'chat:message': (data: SocketChatMessage) => void;
  'consult:error': (data: { message: string }) => void;
}
