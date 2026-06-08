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

    // ── Rapido Mode: Patient dispatches live consult request ──────────────
    socket.on('consult:request', async ({ token, doctorId, patientName, symptoms, medicalIntake }) => {
      try {
        // Join room keyed by the request token
        socket.join(token);
        socket.data.token = token;
        socket.data.role = 'patient';

        // Notify doctor's personal room
        io.to(`doctor:${doctorId}`).emit('consult:incoming', {
          token,
          patientName,
          symptoms,
          medicalIntake,
        });

        console.log(`[Rapido] Patient ${patientName} dispatched to doctor ${doctorId} | token: ${token}`);
      } catch (err) {
        console.error('[Socket] consult:request error:', err.message);
      }
    });

    // ── Doctor joins their personal notification room ──────────────────────
    socket.on('doctor:join', ({ doctorId }) => {
      socket.join(`doctor:${doctorId}`);
      socket.data.doctorId = doctorId;
      socket.data.role = 'doctor';
      console.log(`[Socket] Doctor ${doctorId} joined notification room`);
    });

    // ── Doctor accepts the consult ─────────────────────────────────────────
    socket.on('consult:accept', async ({ token, doctorId, doctorName, doctorAvatar }) => {
      try {
        socket.join(token);
        socket.data.token = token;

        // Update DB
        const request = await prisma.consultRequest.update({
          where: { requestToken: token },
          data: { status: 'ACCEPTED', respondedAt: new Date() },
        });

        // Create telehealth session
        const session = await prisma.telehealthSession.create({
          data: {
            sessionType: 'RAPIDO',
            consultRequestId: request.id,
            patientId: request.patientId,
            doctorId: request.doctorId,
            status: 'ACTIVE',
          },
        });

        // Notify both parties in the token room
        io.to(token).emit('session:started', {
          sessionId: session.id,
          doctorName,
          doctorAvatar,
        });

        console.log(`[Rapido] Session ${session.id} started | token: ${token}`);
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

        // Broadcast to everyone in the token room
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

    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getIO() {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
}
