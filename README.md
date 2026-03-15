# 1-to-1 WebRTC Video Call Application

A logically correct, strict peer-to-peer video calling application using Native WebRTC and Socket.IO.

## Architecture

 This project strictly adheres to WebRTC best practices:
- **Media**: Flows directly between browsers (Peer-to-Peer). The server never touches the video stream.
- **Signaling**: Socket.IO is used ONLY to exchange connection data (SDP Offers, Answers, ICE Candidates).
- **Rooms**: Connections are scoped to unique rooms.

### Signaling Flow
1. **Join Room**: User A joins a room.
2. **User B Joins**: User A (or B) acts as the "Caller".
3. **Offer**: Caller creates an SDP Offer and sends it via server.
4. **Answer**: Callee receives Offer, creates SDP Answer, and sends it back.
5. **ICE Candidates**: Both network stacks find reachable paths (candidates) and exchange them.
6. **P2P Connection**: Once connected, media flows directly between peers.

## Project Structure

```
/server       # Node.js + Socket.IO Signaling Server
/client       # React + Vite Frontend
  /src
    /hooks    # useWebRTC Custom Hook (Core Logic)
    /pages    # LandingPage and CallPage
    /services # Socket Singleton
```

## How to Run

### Prerequisites
- Node.js installed

### 1. Start Support Server
```bash
cd server
npm install
npm run dev
```
Runs on `http://localhost:5000`

### 2. Start Client
```bash
cd client
npm install
npm run dev
```
Runs on `http://localhost:5173` (usually)

### 3. Test
1. Open Client URL in Browser Tab 1.
2. Enter a Room ID (e.g., "test1") -> Join.
3. Open Client URL in Browser Tab 2.
4. Enter SAME Room ID ("test1") -> Join.
5. Video connection should be established.

## Common Issues
- **Permissions**: Ensure you allow Camera/Microphone access.
- **Firewalls**: If testing on different networks, a TURN server is required (not included in this MVP). Use same WiFi/LAN.
