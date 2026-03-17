import { Server, Socket } from 'socket.io';

interface SocketData {
  userId?: string;
  userRole?: string;
  hospitalId?: string;
}

// Store connected users
const connectedUsers = new Map<string, SocketData>();

export const initializeSocket = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Authentication
    socket.on('authenticate', (data: { userId: string; userRole: string; hospitalId: string }) => {
      socket.data = data;
      connectedUsers.set(socket.id, data);

      // Join hospital-specific room
      socket.join(`hospital:${data.hospitalId}`);

      // Join role-specific room
      socket.join(`hospital:${data.hospitalId}:role:${data.userRole}`);

      // Join user-specific room
      socket.join(`user:${data.userId}`);

      console.log(`User ${data.userId} authenticated as ${data.userRole}`);
      
      socket.emit('authenticated', { success: true });
    });

    // Queue updates
    socket.on('join-queue', (data: { doctorId: string }) => {
      if (socket.data?.hospitalId) {
        socket.join(`hospital:${socket.data.hospitalId}:queue:doctor:${data.doctorId}`);
      }
    });

    socket.on('leave-queue', (data: { doctorId: string }) => {
      if (socket.data?.hospitalId) {
        socket.leave(`hospital:${socket.data.hospitalId}:queue:doctor:${data.doctorId}`);
      }
    });

    // Doctor calls patient
    socket.on('call-patient', (data: { patientId: string; tokenNumber: number }) => {
      if (socket.data?.hospitalId) {
        io.to(`hospital:${socket.data.hospitalId}`).emit('patient-called', {
          patientId: data.patientId,
          tokenNumber: data.tokenNumber,
          timestamp: new Date().toISOString(),
        });
      }
    });

    // Queue status update
    socket.on('queue-update', (data: { doctorId: string; queueData: any }) => {
      if (socket.data?.hospitalId) {
        io.to(`hospital:${socket.data.hospitalId}:queue:doctor:${data.doctorId}`).emit('queue-updated', data.queueData);
      }
    });

    // Lab results notification
    socket.on('lab-result-ready', (data: { patientId: string; orderId: string }) => {
      if (socket.data?.hospitalId) {
        io.to(`user:${data.patientId}`).emit('lab-result-notification', {
          orderId: data.orderId,
          timestamp: new Date().toISOString(),
        });
      }
    });

    // Vitals recorded notification
    socket.on('vitals-recorded', (data: { patientId: string; doctorId: string }) => {
      if (socket.data?.hospitalId) {
        io.to(`user:${data.doctorId}`).emit('vitals-ready', {
          patientId: data.patientId,
          timestamp: new Date().toISOString(),
        });
      }
    });

    // Prescription notification
    socket.on('prescription-created', (data: { patientId: string; prescriptionId: string }) => {
      if (socket.data?.hospitalId) {
        io.to(`hospital:${socket.data.hospitalId}:role:PHARMACIST`).emit('new-prescription', {
          patientId: data.patientId,
          prescriptionId: data.prescriptionId,
          timestamp: new Date().toISOString(),
        });
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      connectedUsers.delete(socket.id);
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

// Helper functions to emit events from controllers
export const emitQueueUpdate = (io: Server, hospitalId: string, doctorId: string, queueData: any) => {
  io.to(`hospital:${hospitalId}:queue:doctor:${doctorId}`).emit('queue-updated', queueData);
};

export const emitPatientCalled = (io: Server, hospitalId: string, data: { patientId: string; tokenNumber: number }) => {
  io.to(`hospital:${hospitalId}`).emit('patient-called', {
    ...data,
    timestamp: new Date().toISOString(),
  });
};

export const emitVitalsReady = (io: Server, doctorId: string, data: { patientId: string }) => {
  io.to(`user:${doctorId}`).emit('vitals-ready', {
    ...data,
    timestamp: new Date().toISOString(),
  });
};

export const emitLabResultReady = (io: Server, patientId: string, doctorId: string, data: { orderId: string }) => {
  io.to(`user:${patientId}`).emit('lab-result-notification', data);
  io.to(`user:${doctorId}`).emit('lab-result-notification', data);
};

export const emitNewPrescription = (io: Server, hospitalId: string, data: { patientId: string; prescriptionId: string }) => {
  io.to(`hospital:${hospitalId}:role:PHARMACIST`).emit('new-prescription', {
    ...data,
    timestamp: new Date().toISOString(),
  });
};
