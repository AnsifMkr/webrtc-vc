import { useState, useEffect, useRef, useCallback } from 'react';
import socketService from '../services/socket';

const ICE_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:global.stun.twilio.com:3478' }
    ]
};

export const useWebRTC = (roomId) => {
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [connectionState, setConnectionState] = useState('idle'); // idle, connecting, connected, disconnected, failed, full
    const [mediaState, setMediaState] = useState('initial'); // initial, requesting, ready, error
    const [isAudioEnabled, setIsAudioEnabled] = useState(true);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);

    const peerConnection = useRef(null);
    const socket = socketService.getSocket();

    // 1. Get User Media
    useEffect(() => {
        const startMedia = async () => {
            setMediaState('requesting');
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                setLocalStream(stream);
                setMediaState('ready');
            } catch (err) {
                console.error("Error accessing media devices:", err);
                setMediaState('error');
            }
        };

        startMedia();

        return () => {
            // Cleanup media tracks on unmount
            setLocalStream(prevStream => {
                if (prevStream) {
                    prevStream.getTracks().forEach(track => track.stop());
                }
                return null;
            });
        };
    }, []);

    // 2. Initialize Peer Connection
    const createPeerConnection = useCallback(() => {
        if (peerConnection.current) return peerConnection.current;

        console.log("Creating RTCPeerConnection");
        const pc = new RTCPeerConnection(ICE_SERVERS);
        peerConnection.current = pc;

        // Handle ICE candidates
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('ice-candidate', {
                    candidate: event.candidate,
                    // target is implied by room broadcast in server for MVP, 
                    // or we handle target strictly if we knew who we are talking to.
                    // Server relays to "others in room".
                    roomId
                });
            }
        };

        // Handle Remote Stream
        pc.ontrack = (event) => {
            console.log("Received remote track");
            setRemoteStream(event.streams[0]);
        };

        // Handle Connection State
        pc.onconnectionstatechange = () => {
            console.log("Connection state change:", pc.connectionState);
            setConnectionState(pc.connectionState);
        };

        // Add local tracks to PC
        if (localStream) {
            localStream.getTracks().forEach(track => {
                pc.addTrack(track, localStream);
            });
        }

        return pc;

    }, [localStream, roomId, socket]);

    // 3. Socket Event Listeners for Signaling
    useEffect(() => {
        if (!socket || !roomId || mediaState !== 'ready') return;

        // Ensure socket is connected
        if (!socket.connected) {
            socket.connect();
        }

        // Join the room (Handle refresh / direct URL access)
        socket.emit('join-room', roomId);

        // Handle User Joined -> Initiate Offer
        const handleUserJoined = async () => {
            console.log("User joined, creating offer as Caller");
            const pc = createPeerConnection(); // Ensure PC exists
            if (!pc) return;

            try {
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                socket.emit('offer', { signal: offer, roomId });
                setConnectionState('connecting');
            } catch (err) {
                console.error("Error creating offer:", err);
            }
        };

        // Handle Offer -> Create Answer
        const handleOffer = async ({ signal }) => {
            console.log("Received Offer");
            let pc = peerConnection.current;
            if (!pc) {
                pc = createPeerConnection();
            }

            try {
                // If we are in have-local-offer state (glare), we usually rollback, but strict 1-to-1 often simplifies by polite/impolite roles.
                // Here we just accept the latest offer for simplicity unless we want robust collision handling.
                if (pc.signalingState !== 'stable') {
                    // In a true production app, use "Perfect Negotiation" pattern.
                    // For this strict concept, we assume strict Caller/Callee or proceed.
                    console.warn("Signaling state is not stable:", pc.signalingState);
                    // If we both offered, one must yield. Simple heuristic: Compare IDs? 
                    // Or just process if we can.
                    await Promise.all([
                        pc.setLocalDescription({ type: 'rollback' }),
                        pc.setRemoteDescription(new RTCSessionDescription(signal))
                    ]);
                } else {
                    await pc.setRemoteDescription(new RTCSessionDescription(signal));
                }

                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                socket.emit('answer', { signal: answer, roomId });
                setConnectionState('connecting');
            } catch (err) {
                console.error("Error handling offer:", err);
            }
        };

        // Handle Answer
        const handleAnswer = async ({ signal }) => {
            console.log("Received Answer");
            const pc = peerConnection.current;
            if (pc) {
                try {
                    await pc.setRemoteDescription(new RTCSessionDescription(signal));
                } catch (err) {
                    console.error("Error passing answer:", err);
                }
            }
        };

        // Handle ICE Candidate
        const handleIceCandidate = async ({ candidate }) => {
            const pc = peerConnection.current;
            if (pc) {
                try {
                    await pc.addIceCandidate(new RTCIceCandidate(candidate));
                } catch (err) {
                    console.error("Error adding ICE candidate:", err);
                }
            }
        };

        // Handle Room Full
        const handleRoomFull = () => {
            console.warn("Room is full");
            setConnectionState('full');
            // Allow UI to handle the redirect or error display
        };

        socket.on('user-joined', handleUserJoined);
        socket.on('offer', handleOffer);
        socket.on('answer', handleAnswer);
        socket.on('ice-candidate', handleIceCandidate);
        socket.on('room-full', handleRoomFull);

        return () => {
            socket.off('user-joined', handleUserJoined);
            socket.off('offer', handleOffer);
            socket.off('answer', handleAnswer);
            socket.off('ice-candidate', handleIceCandidate);
            socket.off('room-full', handleRoomFull);
        };
    }, [roomId, socket, mediaState, localStream, createPeerConnection]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (peerConnection.current) {
                peerConnection.current.close();
                peerConnection.current = null;
            }
        };
    }, []);

    // Toggle Functions
    const toggleAudio = () => {
        if (localStream) {
            const audioTrack = localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsAudioEnabled(audioTrack.enabled);
            }
        }
    };

    const toggleVideo = () => {
        if (localStream) {
            const videoTrack = localStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsVideoEnabled(videoTrack.enabled);
            }
        }
    };

    return {
        localStream,
        remoteStream,
        connectionState,
        mediaState,
        isAudioEnabled,
        isVideoEnabled,
        toggleAudio,
        toggleVideo
    };
};
