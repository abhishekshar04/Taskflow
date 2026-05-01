import { io } from 'socket.io-client';

const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
  autoConnect: false, // We will connect manually when logged in
  withCredentials: true,
});

export default socket;
