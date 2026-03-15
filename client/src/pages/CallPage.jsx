import React, { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWebRTC } from '../hooks/useWebRTC';
import socketService from '../services/socket';

const CallPage = () => {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const {
        localStream,
        remoteStream,
        connectionState,
        mediaState,
        isAudioEnabled,
        isVideoEnabled,
        toggleAudio,
        toggleVideo
    } = useWebRTC(roomId);

    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);

    // Attach streams to video elements
    useEffect(() => {
        if (localStream && localVideoRef.current) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    useEffect(() => {
        if (remoteStream && remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream]);

    // Handle Room Full or Failures
    useEffect(() => {
        if (connectionState === 'full') {
            alert('Room is full!');
            navigate('/');
        }
    }, [connectionState, navigate]);

    const handleLeave = () => {
        // Disconnect socket and go back
        socketService.disconnect();
        navigate('/');
        window.location.reload(); // Hard reload to clear all WebRTC states cleanly
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4">
            <div className="w-full max-w-6xl relative">

                {/* Header / Status */}
                <div className="absolute top-4 left-4 z-10 bg-black/50 p-2 rounded backdrop-blur-sm">
                    <p className="text-gray-300">Room: <span className="font-mono text-white">{roomId}</span></p>
                    <p className={`text-sm font-bold ${connectionState === 'connected' ? 'text-green-400' :
                            connectionState === 'failed' || connectionState === 'full' ? 'text-red-400' : 'text-yellow-400'
                        }`}>
                        Status: {connectionState}
                    </p>
                </div>

                {/* Main Video Area */}
                <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden border border-gray-800 shadow-2xl">
                    {/* Remote Video (Full Size) */}
                    {remoteStream ? (
                        <video
                            ref={remoteVideoRef}
                            autoPlay
                            playsInline
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="flex items-center justify-center w-full h-full text-gray-500">
                            {connectionState === 'connected' ? 'Waiting for video...' : 'Waiting for peer to join...'}
                        </div>
                    )}

                    {/* Local Video (PIP) */}
                    <div className="absolute bottom-4 right-4 w-48 h-36 bg-black rounded-lg border-2 border-gray-700 overflow-hidden shadow-lg">
                        {localStream ? (
                            <video
                                ref={localVideoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-cover transform scale-x-[-1]" // Mirror local video
                            />
                        ) : (
                            <div className="flex items-center justify-center w-full h-full text-xs text-gray-500">
                                {mediaState === 'requesting' ? 'Loading Camera...' : 'No Camera'}
                            </div>
                        )}
                        <div className="absolute bottom-2 left-2 flex gap-1">
                            {!isAudioEnabled && <span className="bg-red-500 text-xs px-1 rounded">Muted</span>}
                            {!isVideoEnabled && <span className="bg-red-500 text-xs px-1 rounded">No Video</span>}
                        </div>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex justify-center mt-6 space-x-4">
                    <button
                        onClick={toggleAudio}
                        className={`px-6 py-3 rounded-full font-bold shadow-lg transition transform hover:scale-105 ${isAudioEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'}`}
                    >
                        {isAudioEnabled ? 'Mute Mic' : 'Unmute Mic'}
                    </button>
                    <button
                        onClick={toggleVideo}
                        className={`px-6 py-3 rounded-full font-bold shadow-lg transition transform hover:scale-105 ${isVideoEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'}`}
                    >
                        {isVideoEnabled ? 'Stop Camera' : 'Start Camera'}
                    </button>
                    <button
                        onClick={handleLeave}
                        className="bg-red-600 hover:bg-red-900 text-white px-8 py-3 rounded-full font-bold shadow-lg transition transform hover:scale-105"
                    >
                        Leave Call
                    </button>
                </div>
            </div>

            {/* Error Handling UI */}
            {mediaState === 'error' && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
                    <div className="bg-gray-800 p-8 rounded-lg max-w-md text-center">
                        <h2 className="text-red-500 text-2xl font-bold mb-4">Camera Error</h2>
                        <p className="text-gray-300 mb-6">Could not access camera/microphone. Please check permissions.</p>
                        <button onClick={handleLeave} className="bg-blue-600 px-6 py-2 rounded">Go Back</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CallPage;
