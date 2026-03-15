import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';

class SocketService {
    socket;

    constructor() {
        this.socket = io(SOCKET_URL, {
            autoConnect: false, // We connect explicitly when joining/landing
        });

        this.socket.on('connect', () => {
            console.log('Socket connected:', this.socket.id);
        });

        this.socket.on('disconnect', () => {
            console.log('Socket disconnected');
        });

        this.socket.on('connect_error', (err) => {
            console.error('Socket connection error:', err);
        });
    }

    connect() {
        if (!this.socket.connected) {
            this.socket.connect();
        }
    }

    disconnect() {
        if (this.socket.connected) {
            this.socket.disconnect();
        }
    }

    getSocket() {
        return this.socket;
    }
}

const socketService = new SocketService();
export default socketService;
