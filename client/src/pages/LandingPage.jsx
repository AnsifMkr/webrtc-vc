import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import socketService from '../services/socket';

const LandingPage = () => {
    const [roomId, setRoomId] = useState('');
    const navigate = useNavigate();

    const handleJoin = (e) => {
        e.preventDefault();
        if (!roomId.trim()) return;

        // Navigate to call page with roomId
        // Joining is now handled by the CallPage/useWebRTC hook
        navigate(`/room/${roomId}`);
    };

    const handleCreate = () => {
        const newRoomId = Math.random().toString(36).substring(7);
        setRoomId(newRoomId);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
            <h1 className="text-4xl font-bold mb-8">WebRTC Video Call</h1>
            <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-96">
                <form onSubmit={handleJoin} className="flex flex-col space-y-4">
                    <label className="text-sm font-medium text-gray-300">Room ID</label>
                    <div className="flex space-x-2">
                        <input
                            type="text"
                            className="flex-1 bg-gray-700 border border-gray-600 rounded px-4 py-2 focus:outline-none focus:border-blue-500"
                            placeholder="Enter Room ID"
                            value={roomId}
                            onChange={(e) => setRoomId(e.target.value)}
                        />
                        <button
                            type="button"
                            onClick={handleCreate}
                            className="bg-gray-600 hover:bg-gray-500 text-white px-3 py-2 rounded"
                            title="Generate Random ID"
                        >
                            🎲
                        </button>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-200"
                    >
                        Join Room
                    </button>
                </form>
            </div>
            <p className="mt-8 text-gray-400 text-sm max-w-md text-center">
                Strict 1-to-1 video calling. Media flows peer-to-peer. Signaling via server.
            </p>
        </div>
    );
};

export default LandingPage;
