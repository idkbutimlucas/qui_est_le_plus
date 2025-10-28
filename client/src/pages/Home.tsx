import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';

export default function Home() {
  const [mode, setMode] = useState<'menu' | 'create' | 'join'>('menu');
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string>();
  const { room, createRoom, joinRoom, error, clearError } = useSocket();
  const navigate = useNavigate();

  useEffect(() => {
    if (room) {
      navigate('/lobby');
    }
  }, [room, navigate]);

  useEffect(() => {
    clearError();
  }, [mode, clearError]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_SIZE) {
              height = (height * MAX_SIZE) / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width = (width * MAX_SIZE) / height;
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
          setAvatarPreview(compressedBase64);
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateRoom = () => {
    if (playerName.trim()) {
      createRoom(playerName, avatarPreview);
    }
  };

  const handleJoinRoom = () => {
    if (playerName.trim() && roomCode.trim()) {
      joinRoom(roomCode, playerName, avatarPreview);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-white">
      <div className="max-w-md w-full">
        {/* Titre principal avec logo */}
        <div className="text-center mb-8">
          <div className="inline-block mb-4">
            <img src="/logo.png" alt="Logo" className="w-32 h-32 mx-auto" />
          </div>
          <h1 className="text-6xl font-bold mb-3 text-black font-grotesk">
            QUI EST LE +
          </h1>
          <p className="text-gray-600 text-lg font-medium font-sans">
            Le jeu pour mieux se connaître
          </p>
        </div>

        {/* Menu principal */}
        {mode === 'menu' && (
          <div className="glass-card rounded-2xl p-6 space-y-4">
            <button
              onClick={() => setMode('create')}
              className="w-full bg-black hover:bg-gray-800 text-white font-semibold text-lg py-4 px-6 rounded-xl transition-all duration-200 font-grotesk"
            >
              <div className="flex items-center justify-center gap-3">
                <span className="text-xl">+</span>
                <span>Créer une partie</span>
              </div>
            </button>
            <button
              onClick={() => setMode('join')}
              className="w-full bg-white hover:bg-gray-50 text-black border border-gray-300 font-semibold text-lg py-4 px-6 rounded-xl transition-all duration-200 font-grotesk"
            >
              <div className="flex items-center justify-center gap-3">
                <span className="text-xl">→</span>
                <span>Rejoindre une partie</span>
              </div>
            </button>
          </div>
        )}

        {/* Créer une room */}
        {mode === 'create' && (
          <div className="glass-card rounded-2xl p-6 space-y-5">
            <button
              onClick={() => {
                setMode('menu');
                clearError();
              }}
              className="text-gray-700 hover:text-black font-medium font-sans flex items-center gap-2 transition-all"
            >
              <span className="text-lg">←</span>
              <span>Retour</span>
            </button>

            <h2 className="text-3xl font-bold text-black text-center font-grotesk">
              Créer une partie
            </h2>

            {error && (
              <div className="bg-red-50 border border-red-300 text-red-800 px-4 py-3 rounded-xl font-medium font-sans">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-gray-700 font-medium font-sans text-sm">
                Ton nom
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-black focus:ring-1 focus:ring-black font-sans text-black placeholder-gray-400 transition-all"
                placeholder="Entre ton nom..."
                maxLength={20}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-gray-700 font-medium font-sans text-sm">
                Ta photo (optionnel)
              </label>
              <div className="flex items-center gap-3">
                {avatarPreview && (
                  <img
                    src={avatarPreview}
                    alt="Avatar"
                    className="w-16 h-16 rounded-full object-cover border-2 border-black"
                  />
                )}
                <label className="flex-1 bg-white border border-gray-300 border-dashed rounded-xl px-4 py-3 text-center cursor-pointer hover:border-black transition-all">
                  <span className="font-medium text-gray-700 font-sans text-sm">
                    {avatarPreview ? 'Changer la photo' : 'Ajouter une photo'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <button
              onClick={handleCreateRoom}
              disabled={!playerName.trim()}
              className="w-full bg-black hover:bg-gray-800 text-white font-bold text-lg py-4 px-6 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-grotesk"
            >
              Créer la partie
            </button>
          </div>
        )}

        {/* Rejoindre une room */}
        {mode === 'join' && (
          <div className="glass-card rounded-2xl p-6 space-y-5">
            <button
              onClick={() => {
                setMode('menu');
                clearError();
              }}
              className="text-gray-700 hover:text-black font-medium font-sans flex items-center gap-2 transition-all"
            >
              <span className="text-lg">←</span>
              <span>Retour</span>
            </button>

            <h2 className="text-3xl font-bold text-black text-center font-grotesk">
              Rejoindre une partie
            </h2>

            {error && (
              <div className="bg-red-50 border border-red-300 text-red-800 px-4 py-3 rounded-xl font-medium font-sans">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-gray-700 font-medium font-sans text-sm">
                Code de la partie
              </label>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-black focus:ring-1 focus:ring-black font-mono text-2xl font-bold uppercase text-center tracking-widest text-black placeholder-gray-400 transition-all"
                placeholder="ABC123"
                maxLength={6}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-gray-700 font-medium font-sans text-sm">
                Ton nom
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-black focus:ring-1 focus:ring-black font-sans text-black placeholder-gray-400 transition-all"
                placeholder="Entre ton nom..."
                maxLength={20}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-gray-700 font-medium font-sans text-sm">
                Ta photo (optionnel)
              </label>
              <div className="flex items-center gap-3">
                {avatarPreview && (
                  <img
                    src={avatarPreview}
                    alt="Avatar"
                    className="w-16 h-16 rounded-full object-cover border-2 border-black"
                  />
                )}
                <label className="flex-1 bg-white border border-gray-300 border-dashed rounded-xl px-4 py-3 text-center cursor-pointer hover:border-black transition-all">
                  <span className="font-medium text-gray-700 font-sans text-sm">
                    {avatarPreview ? 'Changer la photo' : 'Ajouter une photo'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <button
              onClick={handleJoinRoom}
              disabled={!playerName.trim() || !roomCode.trim()}
              className="w-full bg-black hover:bg-gray-800 text-white font-bold text-lg py-4 px-6 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-grotesk"
            >
              Rejoindre
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
