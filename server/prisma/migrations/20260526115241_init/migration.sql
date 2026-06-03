-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Patient" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "dateOfBirth" DATETIME,
    "gender" TEXT,
    "bloodType" TEXT,
    CONSTRAINT "Patient_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Doctor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "specialty" TEXT NOT NULL,
    "qualification" TEXT NOT NULL,
    "workplace" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "feeInr" INTEGER NOT NULL,
    "availableMinutesDaily" INTEGER NOT NULL DEFAULT 120,
    "experienceYears" INTEGER NOT NULL,
    "rating" REAL NOT NULL DEFAULT 5.0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Doctor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PatientMedicalIntake" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "occupation" TEXT NOT NULL,
    "workHoursWeekly" INTEGER NOT NULL,
    "workExertion" TEXT NOT NULL,
    "personalHistory" TEXT NOT NULL DEFAULT '',
    CONSTRAINT "PatientMedicalIntake_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PatientHereditaryCondition" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "conditionName" TEXT NOT NULL,
    CONSTRAINT "PatientHereditaryCondition_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PatientOccupationalExposure" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "exposureType" TEXT NOT NULL,
    CONSTRAINT "PatientOccupationalExposure_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DoctorAvailability" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "doctorId" TEXT NOT NULL,
    "availableDate" TEXT NOT NULL,
    "timeSlot" TEXT NOT NULL,
    "isBooked" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "DoctorAvailability_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DoctorCertification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "doctorId" TEXT NOT NULL,
    "degreeName" TEXT NOT NULL,
    "certificateFileUrl" TEXT,
    CONSTRAINT "DoctorCertification_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "confirmationCode" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "scheduledDate" TEXT NOT NULL,
    "scheduledSlot" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "status" TEXT NOT NULL DEFAULT 'CONFIRMED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Appointment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Appointment_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ConsultRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requestToken" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "symptomsSummary" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "medicalIntakeSnapshot" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" DATETIME,
    CONSTRAINT "ConsultRequest_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ConsultRequest_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TelehealthSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionType" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "appointmentId" TEXT,
    "consultRequestId" TEXT,
    "patientId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    CONSTRAINT "TelehealthSession_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "TelehealthSession_consultRequestId_fkey" FOREIGN KEY ("consultRequestId") REFERENCES "ConsultRequest" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "TelehealthSession_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TelehealthSession_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SessionChatMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "senderRole" TEXT NOT NULL,
    "messageText" TEXT NOT NULL,
    "sentAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SessionChatMessage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "TelehealthSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SessionChatMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HealthRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "recordCode" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'PRESCRIPTIONS',
    "authorizedByDoctorId" TEXT,
    "authorizedByName" TEXT,
    "authorizedDate" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "fileUrl" TEXT,
    "source" TEXT NOT NULL DEFAULT 'SELF_UPLOADED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HealthRecord_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "HealthRecord_authorizedByDoctorId_fkey" FOREIGN KEY ("authorizedByDoctorId") REFERENCES "Doctor" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PatientVitals" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "recordedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "heartRateBpm" INTEGER,
    "systolicBp" INTEGER,
    "diastolicBp" INTEGER,
    "sleepHours" REAL,
    "dailySteps" INTEGER,
    CONSTRAINT "PatientVitals_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SymptomCheckSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "severity" INTEGER NOT NULL,
    "durationDays" INTEGER NOT NULL,
    "recommendedDepartment" TEXT NOT NULL,
    "diagnosisCondition" TEXT NOT NULL,
    "diagnosisProbability" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SymptomCheckSession_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SymptomCheckItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "checkSessionId" TEXT NOT NULL,
    "symptomId" TEXT NOT NULL,
    "symptomLabel" TEXT NOT NULL,
    "mappedDepartment" TEXT NOT NULL,
    CONSTRAINT "SymptomCheckItem_checkSessionId_fkey" FOREIGN KEY ("checkSessionId") REFERENCES "SymptomCheckSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WellnessSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "sessionType" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "completedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WellnessSession_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Patient_userId_key" ON "Patient"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Doctor_userId_key" ON "Doctor"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PatientMedicalIntake_patientId_key" ON "PatientMedicalIntake"("patientId");

-- CreateIndex
CREATE UNIQUE INDEX "DoctorAvailability_doctorId_availableDate_timeSlot_key" ON "DoctorAvailability"("doctorId", "availableDate", "timeSlot");

-- CreateIndex
CREATE UNIQUE INDEX "Appointment_confirmationCode_key" ON "Appointment"("confirmationCode");

-- CreateIndex
CREATE UNIQUE INDEX "ConsultRequest_requestToken_key" ON "ConsultRequest"("requestToken");

-- CreateIndex
CREATE UNIQUE INDEX "TelehealthSession_appointmentId_key" ON "TelehealthSession"("appointmentId");

-- CreateIndex
CREATE UNIQUE INDEX "TelehealthSession_consultRequestId_key" ON "TelehealthSession"("consultRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "HealthRecord_recordCode_key" ON "HealthRecord"("recordCode");
