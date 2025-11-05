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
    <div className="neo-container flex items-center justify-center p-4 min-h-screen relative overflow-hidden">
      {/* Formes décoratives organiques en arrière-plan */}
      <div className="fixed top-20 left-16 w-40 h-40 organic-shape-1 bg-accent opacity-10 animate-float-soft"></div>
      <div className="fixed bottom-32 right-24 w-32 h-32 organic-shape-2 bg-accent-secondary opacity-10 animate-pulse-soft" style={{ animationDelay: '1s' }}></div>
      <div className="fixed top-1/2 right-16 w-24 h-24 organic-shape-3 bg-accent opacity-10 animate-float-soft" style={{ animationDelay: '2s' }}></div>

      <div className="max-w-md w-full relative z-10 animate-scale-in">
        {/* Logo et titre */}
        <div className="text-center mb-12">
          <div className="inline-block mb-8 animate-float-soft">
            <div className="neo-card p-6 organic-shape-1">
              <img src="/logo.png" alt="Logo" className="w-32 h-32 mx-auto" />
            </div>
          </div>

          <h1 className="text-5xl font-bold mb-4 text-primary" style={{ fontFamily: 'Papernotes, sans-serif' }}>
            Qui Est Le +
          </h1>
          <p className="text-secondary text-base font-medium">
            Le jeu pour mieux se connaître
          </p>
        </div>

        {/* Menu principal */}
        {mode === 'menu' && (
          <div className="space-y-6 animate-slide-in">
            <button
              onClick={() => setMode('create')}
              className="w-full neo-button-accent py-5 px-8 text-xl font-semibold text-white"
            >
              <div className="flex items-center justify-center gap-3">
                <span className="text-2xl">✨</span>
                <span>Créer une partie</span>
              </div>
            </button>
            <button
              onClick={() => setMode('join')}
              className="w-full neo-button py-5 px-8 text-xl font-semibold text-primary"
            >
              <div className="flex items-center justify-center gap-3">
                <span className="text-2xl">🎮</span>
                <span>Rejoindre une partie</span>
              </div>
            </button>
          </div>
        )}

        {/* Créer une room */}
        {mode === 'create' && (
          <div className="neo-card p-8 space-y-6 animate-slide-in">
            <button
              onClick={() => {
                setMode('menu');
                clearError();
              }}
              className="neo-button px-6 py-3 text-primary font-semibold flex items-center gap-2"
            >
              <span>←</span>
              <span>Retour</span>
            </button>

            <h2 className="text-3xl font-bold text-accent text-center">
              Créer une partie
            </h2>

            {error && (
              <div className="neo-pressed p-4">
                <p className="text-red-600 font-semibold text-center text-sm">
                  {error}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-secondary font-semibold text-sm">
                Ton nom
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="w-full neo-input"
                placeholder="Entre ton nom..."
                maxLength={20}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-secondary font-semibold text-sm">
                Photo (optionnel)
              </label>
              <div className="flex items-center gap-4">
                {avatarPreview && (
                  <div className="neo-avatar w-20 h-20">
                    <img
                      src={avatarPreview}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <label className="flex-1 neo-button px-6 py-4 text-center cursor-pointer text-primary font-semibold">
                  <span>{avatarPreview ? 'Changer' : 'Ajouter une photo'}</span>
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
              className="w-full neo-button-accent py-5 px-8 text-xl font-semibold text-white"
            >
              Créer la partie
            </button>
          </div>
        )}

        {/* Rejoindre une room */}
        {mode === 'join' && (
          <div className="neo-card p-8 space-y-6 animate-slide-in">
            <button
              onClick={() => {
                setMode('menu');
                clearError();
              }}
              className="neo-button px-6 py-3 text-primary font-semibold flex items-center gap-2"
            >
              <span>←</span>
              <span>Retour</span>
            </button>

            <h2 className="text-3xl font-bold text-accent text-center">
              Rejoindre une partie
            </h2>

            {error && (
              <div className="neo-pressed p-4">
                <p className="text-red-600 font-semibold text-center text-sm">
                  {error}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-secondary font-semibold text-sm">
                Code de la partie
              </label>
              <div className="neo-card p-6 text-center organic-shape-1">
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  className="w-full bg-transparent text-center font-mono text-3xl font-bold text-accent focus:outline-none tracking-[0.3em]"
                  placeholder="ABC123"
                  maxLength={6}
                  style={{ textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-secondary font-semibold text-sm">
                Ton nom
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="w-full neo-input"
                placeholder="Entre ton nom..."
                maxLength={20}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-secondary font-semibold text-sm">
                Photo (optionnel)
              </label>
              <div className="flex items-center gap-4">
                {avatarPreview && (
                  <div className="neo-avatar w-20 h-20">
                    <img
                      src={avatarPreview}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <label className="flex-1 neo-button px-6 py-4 text-center cursor-pointer text-primary font-semibold">
                  <span>{avatarPreview ? 'Changer' : 'Ajouter une photo'}</span>
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
              className="w-full neo-button-accent py-5 px-8 text-xl font-semibold text-white"
            >
              Rejoindre
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
