import { io as socketIO, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = socketIO(SOCKET_URL, {
      autoConnect: false,
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
}

/**
 * Connect and authenticate the socket using a JWT token.
 * The token is verified server-side to prevent unauthorized room access.
 * @param token - Valid JWT auth token from login
 */
export function connectSocket(token: string) {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
    s.emit('authenticate', { token });
  }
}

export function disconnectSocket() {
  if (socket?.connected) {
    socket.disconnect();
  }
}
