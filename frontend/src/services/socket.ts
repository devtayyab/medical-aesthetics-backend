import { io, Socket } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

class SocketService {
    private socket: Socket | null = null;

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

        return this.socket;
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    getSocket() {
        return this.socket;
    }

    on(event: string, callback: (...args: any[]) => void) {
        if (this.socket) {
            this.socket.on(event, callback);
        }
    }

    off(event: string, callback?: (...args: any[]) => void) {
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
