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

  // Naviguer vers le lobby quand la room est créée/rejointe
  useEffect(() => {
    if (room) {
      navigate('/lobby');
    }
  }, [room, navigate]);

  // Nettoyer l'erreur quand on change de mode
  useEffect(() => {
    clearError();
  }, [mode, clearError]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Compresser l'image avant de la sauvegarder
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          // Créer un canvas pour redimensionner l'image
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 200; // Taille max en pixels
          let width = img.width;
          let height = img.height;

          // Redimensionner en gardant le ratio
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

          // Convertir en base64 avec compression
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
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Titre principal */}
        <h1 className="text-6xl font-playful text-center mb-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 drop-shadow-lg">
          QUI EST LE +
        </h1>
        <p className="text-center text-gray-600 mb-8 font-cartoon text-lg">
          Le jeu pour mieux se connaître (ou pas) 😄
        </p>

        {/* Menu principal */}
        {mode === 'menu' && (
          <div className="bg-white rounded-3xl shadow-2xl p-8 space-y-4 border-4 border-purple-300">
            <button
              onClick={() => setMode('create')}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-cartoon text-xl py-4 px-6 rounded-2xl hover:scale-105 transform transition shadow-lg hover:shadow-xl"
            >
              🎮 Créer une partie
            </button>
            <button
              onClick={() => setMode('join')}
              className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 text-white font-cartoon text-xl py-4 px-6 rounded-2xl hover:scale-105 transform transition shadow-lg hover:shadow-xl"
            >
              🚀 Rejoindre une partie
            </button>
          </div>
        )}

        {/* Créer une room */}
        {mode === 'create' && (
          <div className="bg-white rounded-3xl shadow-2xl p-8 space-y-6 border-4 border-purple-300">
            <button
              onClick={() => {
                setMode('menu');
                clearError();
              }}
              className="text-gray-500 hover:text-gray-700 font-cartoon"
            >
              ← Retour
            </button>

            <h2 className="text-3xl font-playful text-purple-600 text-center">
              Créer une partie
            </h2>

            {error && (
              <div className="bg-red-100 border-2 border-red-400 text-red-700 px-4 py-3 rounded-xl font-cartoon">
                {error}
              </div>
            )}

            <div>
              <label className="block text-gray-700 font-cartoon mb-2">
                Ton nom
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="w-full px-4 py-3 border-2 border-purple-300 rounded-xl focus:outline-none focus:border-purple-500 font-cartoon text-lg"
                placeholder="Entre ton nom..."
                maxLength={20}
              />
            </div>

            <div>
              <label className="block text-gray-700 font-cartoon mb-2">
                Ta photo (optionnel)
              </label>
              <div className="flex items-center space-x-4">
                {avatarPreview && (
                  <img
                    src={avatarPreview}
                    alt="Avatar"
                    className="w-16 h-16 rounded-full object-cover border-2 border-purple-300"
                  />
                )}
                <label className="flex-1 bg-purple-100 border-2 border-purple-300 border-dashed rounded-xl px-4 py-3 text-center cursor-pointer hover:bg-purple-200 transition">
                  <span className="font-cartoon text-purple-600">
                    📸 {avatarPreview ? 'Changer' : 'Ajouter'} une photo
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
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-cartoon text-xl py-4 px-6 rounded-2xl hover:scale-105 transform transition shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              🎮 Créer la partie
            </button>
          </div>
        )}

        {/* Rejoindre une room */}
        {mode === 'join' && (
          <div className="bg-white rounded-3xl shadow-2xl p-8 space-y-6 border-4 border-orange-300">
            <button
              onClick={() => {
                setMode('menu');
                clearError();
              }}
              className="text-gray-500 hover:text-gray-700 font-cartoon"
            >
              ← Retour
            </button>

            <h2 className="text-3xl font-playful text-orange-600 text-center">
              Rejoindre une partie
            </h2>

            {error && (
              <div className="bg-red-100 border-2 border-red-400 text-red-700 px-4 py-3 rounded-xl font-cartoon">
                {error}
              </div>
            )}

            <div>
              <label className="block text-gray-700 font-cartoon mb-2">
                Code de la partie
              </label>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 border-2 border-orange-300 rounded-xl focus:outline-none focus:border-orange-500 font-cartoon text-lg uppercase text-center tracking-widest"
                placeholder="ABC123"
                maxLength={6}
              />
            </div>

            <div>
              <label className="block text-gray-700 font-cartoon mb-2">
                Ton nom
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="w-full px-4 py-3 border-2 border-orange-300 rounded-xl focus:outline-none focus:border-orange-500 font-cartoon text-lg"
                placeholder="Entre ton nom..."
                maxLength={20}
              />
            </div>

            <div>
              <label className="block text-gray-700 font-cartoon mb-2">
                Ta photo (optionnel)
              </label>
              <div className="flex items-center space-x-4">
                {avatarPreview && (
                  <img
                    src={avatarPreview}
                    alt="Avatar"
                    className="w-16 h-16 rounded-full object-cover border-2 border-orange-300"
                  />
                )}
                <label className="flex-1 bg-orange-100 border-2 border-orange-300 border-dashed rounded-xl px-4 py-3 text-center cursor-pointer hover:bg-orange-200 transition">
                  <span className="font-cartoon text-orange-600">
                    📸 {avatarPreview ? 'Changer' : 'Ajouter'} une photo
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
              className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 text-white font-cartoon text-xl py-4 px-6 rounded-2xl hover:scale-105 transform transition shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              🚀 Rejoindre
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
