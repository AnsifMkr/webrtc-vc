const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

app.use(cors());

const io = new Server(server, {
    cors: {
        origin: ['http://localhost:5173', 'https://webrtc-vc-green.vercel.app', 'https://webrtc-vc-backend-production.up.railway.app'], // Allow local frontend and deployed frontend
        methods: ['GET', 'POST'],
        credentials: true
    },
    transports: ['websocket', 'polling'],
    allowEIO3: true
});

const PORT = 5000;

app.get('/', (req, res) => {
    res.send('Signaling Server is running');
});

// Map to track which room a user is in: socketId -> roomId
const socketToRoom = {};

io.on('connection', (socket) => {
    console.log(`[Connect] User connected: ${socket.id}`);

    socket.on('join-room', (roomId) => {
        if (!roomId) return;

        // For MVP, limit to 2 users per room to ensure 1-to-1 stability
        const room = io.sockets.adapter.rooms.get(roomId);
        const userCount = room ? room.size : 0;

        if (userCount >= 2) {
            console.log(`[Room Full] User ${socket.id} tried to join full room ${roomId}`);
            socket.emit('room-full');
            return;
        }

        socket.join(roomId);
        socketToRoom[socket.id] = roomId;
        console.log(`[Join] User ${socket.id} joined room ${roomId} (Count: ${userCount + 1})`);

        // Notify others in the room that a new user joined
        // Ideally, the existing user should be the "Caller" and initiate the offer
        // But in a simple mesh, the new joiner could also initiate. 
        // Let's stick to the protocol: New user connects -> Logic usually implies existing user (Caller) notices and Call occurs.
        // Or: New user emits 'ready', existing user initiates offer.
        // Simplest: Notify everyone "user-joined", client decides who is Polite vs Impolite.
        socket.to(roomId).emit('user-joined', { userId: socket.id });
    });

    // Signaling: OFFER
    socket.on('offer', (payload) => {
        // payload: { signal: SDP, roomId: string }
        const roomId = socketToRoom[socket.id];
        if (roomId) {
            console.log(`[Signal] Offer from ${socket.id} in room ${roomId}`);
            socket.to(roomId).emit('offer', {
                signal: payload.signal,
                callerId: socket.id
            });
        }
    });

    // Signaling: ANSWER
    socket.on('answer', (payload) => {
        // payload: { signal: SDP, roomId: string }
        const roomId = socketToRoom[socket.id];
        if (roomId) {
            console.log(`[Signal] Answer from ${socket.id} in room ${roomId}`);
            socket.to(roomId).emit('answer', {
                signal: payload.signal,
                responderId: socket.id
            });
        }
    });

    // Signaling: ICE CANDIDATE
    socket.on('ice-candidate', (payload) => {
        const roomId = socketToRoom[socket.id];
        if (roomId) {
            console.log(`[Signal] ICE Candidate from ${socket.id} in room ${roomId}`);
            socket.to(roomId).emit('ice-candidate', {
                candidate: payload.candidate,
                senderId: socket.id
            });
        }
    });

    socket.on('disconnect', () => {
        const roomId = socketToRoom[socket.id];
        if (roomId) {
            console.log(`[Disconnect] User ${socket.id} left room ${roomId}`);
            socket.to(roomId).emit('user-left', { userId: socket.id });
            delete socketToRoom[socket.id];
        } else {
            console.log(`[Disconnect] User ${socket.id} disconnected (no room)`);
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
