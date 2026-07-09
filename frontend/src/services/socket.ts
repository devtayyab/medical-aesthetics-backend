import { io, Socket } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

class SocketService {
 private socket: Socket | null = null;
 // Persist listeners on the service so they survive reconnects: connect() builds a brand-new
 // Socket, and without re-attaching, every handler registered via on() would be silently lost
 // (and any on() called before connect() would no-op).
 private listeners: Array<{ event: string; callback: (...args: any[]) => void }> = [];

 connect(token: string, namespace: string) {
 if (this.socket) {
 this.socket.disconnect();
 }

 // Socket.io needs the base server URL, not the /api prefix
 const baseUrl = API_URL.replace(/\/api$/, '');

 this.socket = io(`${baseUrl}${namespace}`, {
 auth: { token },
 transports: ['websocket'],
 });

 this.socket.on('connect', () => {
 console.log(`Connected to socket namespace: ${namespace}`);
 });

 this.socket.on('connect_error', (error) => {
 console.error(`Socket connection error (${namespace}):`, error);
 });

 // Re-attach all previously registered listeners to the new socket instance.
 this.listeners.forEach(({ event, callback }) => this.socket!.on(event, callback));

 return this.socket;
 }

 disconnect() {
 if (this.socket) {
 this.socket.disconnect();
 this.socket = null;
 }
 // Keep `listeners` so a later reconnect re-subscribes them automatically.
 }

 getSocket() {
 return this.socket;
 }

 on(event: string, callback: (...args: any[]) => void) {
 // Track every subscription so it can be (re)attached to the current/next socket.
 this.listeners.push({ event, callback });
 if (this.socket) {
 this.socket.on(event, callback);
 }
 }

 off(event: string, callback?: (...args: any[]) => void) {
 this.listeners = this.listeners.filter(
 (l) => !(l.event === event && (!callback || l.callback === callback)),
 );
 if (this.socket) {
 this.socket.off(event, callback);
 }
 }

 emit(event: string, data: any) {
 if (this.socket) {
 this.socket.emit(event, data);
 }
 }
}

export const socketService = new SocketService();
