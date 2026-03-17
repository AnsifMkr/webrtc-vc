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
        <div className="flex flex-col h-screen h-[100dvh] bg-black text-white overflow-hidden p-2 sm:p-4">
            <div className="flex-1 w-full max-w-7xl mx-auto flex flex-col min-h-0">
                
                {/* Main Video Area */}
                <div className="flex-1 w-full relative bg-gray-900 rounded-xl overflow-hidden shadow-2xl border border-gray-800 flex items-center justify-center min-h-0">
                    
                    {/* Header / Status */}
                    <div className="absolute top-4 left-4 z-10 bg-black/50 p-2 sm:p-3 rounded-lg backdrop-blur-sm border border-gray-700/50">
                        <p className="text-gray-300 text-xs sm:text-sm">Room: <span className="font-mono text-white">{roomId}</span></p>
                        <p className={`text-xs sm:text-sm font-bold ${connectionState === 'connected' ? 'text-green-400' :
                                connectionState === 'failed' || connectionState === 'full' ? 'text-red-400' : 'text-yellow-400'
                            }`}>
                            Status: {connectionState}
                        </p>
                    </div>

                    {/* Remote Video (Full Size) */}
                    {remoteStream ? (
                        <video
                            ref={remoteVideoRef}
                            autoPlay
                            playsInline
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center w-full h-full text-gray-500 p-4 text-center">
                            <span className="text-sm sm:text-base">
                                {connectionState === 'connected' ? 'Waiting for video...' : 'Waiting for peer to join...'}
                            </span>
                        </div>
                    )}

                    {/* Local Video (PIP) */}
                    <div className="absolute bottom-4 right-4 w-28 h-36 md:w-48 md:h-36 bg-black rounded-lg border border-gray-600 overflow-hidden shadow-2xl z-20">
                        {localStream ? (
                            <video
                                ref={localVideoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-cover transform scale-x-[-1]" // Mirror local video
                            />
                        ) : (
                            <div className="flex items-center justify-center w-full h-full text-[10px] md:text-xs text-gray-500 p-2 text-center">
                                {mediaState === 'requesting' ? 'Loading Camera...' : 'No Camera'}
                            </div>
                        )}
                        <div className="absolute bottom-2 left-2 flex flex-wrap gap-1">
                            {!isAudioEnabled && <span className="bg-red-500/90 text-[10px] px-1.5 py-0.5 rounded backdrop-blur-sm">Muted</span>}
                            {!isVideoEnabled && <span className="bg-red-500/90 text-[10px] px-1.5 py-0.5 rounded backdrop-blur-sm">No Video</span>}
                        </div>
                    </div>
                </div>

                {/* Controls Area (Fixed at bottom) */}
                <div className="h-20 sm:h-24 shrink-0 flex items-center justify-center gap-2 sm:gap-4 mt-2 sm:mt-4">
                    <button
                        onClick={toggleAudio}
                        className={`flex-1 max-w-[140px] py-3 sm:py-4 rounded-xl sm:rounded-full font-bold shadow-lg transition-transform transform active:scale-95 sm:hover:scale-105 text-xs sm:text-sm md:text-base flex items-center justify-center ${isAudioEnabled ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}`}
                    >
                        {isAudioEnabled ? 'Mute Mic' : 'Unmute Mic'}
                    </button>
                    <button
                        onClick={toggleVideo}
                        className={`flex-1 max-w-[140px] py-3 sm:py-4 rounded-xl sm:rounded-full font-bold shadow-lg transition-transform transform active:scale-95 sm:hover:scale-105 text-xs sm:text-sm md:text-base flex items-center justify-center ${isVideoEnabled ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}`}
                    >
                        {isVideoEnabled ? 'Stop Cam' : 'Start Cam'}
                    </button>
                    <button
                        onClick={handleLeave}
                        className="flex-1 max-w-[140px] bg-red-600 hover:bg-red-700 text-white py-3 sm:py-4 rounded-xl sm:rounded-full font-bold shadow-lg transition-transform transform active:scale-95 sm:hover:scale-105 text-xs sm:text-sm md:text-base flex items-center justify-center"
                    >
                        Leave
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
