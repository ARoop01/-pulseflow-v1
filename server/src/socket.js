import { Server } from 'socket.io';
import prisma from './lib/prisma.js';

let io;

export function initSocket(httpServer) {
  const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim());

  io = new Server(httpServer, {
    cors: {
      origin: process.env.NODE_ENV === 'production' ? true : allowedOrigins,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // ── Doctor comes online ────────────────────────────────────────────────
    socket.on('doctor:join', async ({ doctorId }) => {
      socket.join(`doctor:${doctorId}`);
      socket.data.doctorId = doctorId;
      socket.data.role = 'doctor';
      try {
        await prisma.doctor.update({ where: { id: doctorId }, data: { isOnline: true } });
      } catch {}
      console.log(`[Socket] Doctor ${doctorId} is now online`);
    });

    // ── Patient dispatches live consult to specialty queue ─────────────────
    socket.on('consult:request', async ({ token, specialty, patientName, symptoms, medicalIntake }) => {
      try {
        socket.join(token);
        socket.data.token = token;
        socket.data.role = 'patient';

        // Find all online doctors in the requested specialty
        const availableDoctors = await prisma.doctor.findMany({
          where: { specialty, isOnline: true },
          select: { id: true },
        });

        if (availableDoctors.length === 0) {
          socket.emit('consult:no_doctors', { specialty });
          console.log(`[Rapido] No online doctors for specialty ${specialty}`);
          return;
        }

        // Broadcast to all online doctors in this specialty
        availableDoctors.forEach((doc) => {
          io.to(`doctor:${doc.id}`).emit('consult:incoming', {
            token,
            patientName,
            symptoms,
            medicalIntake,
            specialty,
          });
        });

        console.log(`[Rapido] Patient ${patientName} broadcast to ${availableDoctors.length} ${specialty} doctors | token: ${token}`);

        // 30-second timeout: if no doctor accepts, mark as TIMEOUT
        setTimeout(async () => {
          try {
            const current = await prisma.consultRequest.findUnique({ where: { requestToken: token } });
            if (current?.status === 'PENDING') {
              await prisma.consultRequest.update({
                where: { requestToken: token },
                data: { status: 'TIMEOUT', respondedAt: new Date() },
              });
              io.to(token).emit('consult:timeout', { token });
              console.log(`[Rapido] Request timed out | token: ${token}`);
            }
          } catch {}
        }, 30000);
      } catch (err) {
        console.error('[Socket] consult:request error:', err.message);
      }
    });

    // ── Doctor accepts the consult ─────────────────────────────────────────
    socket.on('consult:accept', async ({ token, doctorId, doctorName, doctorAvatar }) => {
      try {
        socket.join(token);
        socket.data.token = token;

        // Update DB — assign the accepting doctor and mark accepted
        const request = await prisma.consultRequest.update({
          where: { requestToken: token },
          data: { status: 'ACCEPTED', doctorId, respondedAt: new Date() },
        });

        // Cancel notifications to other doctors in the same specialty
        const otherDoctors = await prisma.doctor.findMany({
          where: { specialty: request.specialty, isOnline: true, id: { not: doctorId } },
          select: { id: true },
        });
        otherDoctors.forEach((doc) => {
          io.to(`doctor:${doc.id}`).emit('consult:taken', { token });
        });

        const session = await prisma.telehealthSession.create({
          data: {
            sessionType: 'RAPIDO',
            consultRequestId: request.id,
            patientId: request.patientId,
            doctorId,
            status: 'ACTIVE',
          },
        });

        io.to(token).emit('session:started', {
          sessionId: session.id,
          doctorName,
          doctorAvatar,
        });

        console.log(`[Rapido] Session ${session.id} started with Dr. ${doctorName} | token: ${token}`);
      } catch (err) {
        console.error('[Socket] consult:accept error:', err.message);
        socket.emit('consult:error', { message: 'Failed to start session' });
      }
    });

    // ── Doctor declines the consult ────────────────────────────────────────
    socket.on('consult:decline', async ({ token }) => {
      try {
        await prisma.consultRequest.update({
          where: { requestToken: token },
          data: { status: 'DECLINED', respondedAt: new Date() },
        });

        io.to(token).emit('consult:declined', { token });
        console.log(`[Rapido] Request declined | token: ${token}`);
      } catch (err) {
        console.error('[Socket] consult:decline error:', err.message);
      }
    });

    // ── In-session chat messages ───────────────────────────────────────────
    socket.on('chat:message', async ({ sessionId, text, senderRole, senderId, token }) => {
      try {
        const message = await prisma.sessionChatMessage.create({
          data: {
            sessionId,
            senderId,
            senderRole,
            messageText: text,
          },
        });

        io.to(token).emit('chat:message', {
          id: message.id,
          sessionId,
          text,
          senderRole,
          sentAt: message.sentAt,
        });
      } catch (err) {
        console.error('[Socket] chat:message error:', err.message);
      }
    });

    // ── Session ended ──────────────────────────────────────────────────────
    socket.on('session:ended', async ({ sessionId, token }) => {
      try {
        await prisma.telehealthSession.update({
          where: { id: sessionId },
          data: { status: 'ENDED', endedAt: new Date() },
        });

        io.to(token).emit('session:ended', { sessionId });
        console.log(`[Socket] Session ${sessionId} ended`);
      } catch (err) {
        console.error('[Socket] session:ended error:', err.message);
      }
    });

    socket.on('disconnect', async () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
      if (socket.data.role === 'doctor' && socket.data.doctorId) {
        try {
          await prisma.doctor.update({
            where: { id: socket.data.doctorId },
            data: { isOnline: false },
          });
        } catch {}
      }
    });
  });

  return io;
}

export function getIO() {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
}
