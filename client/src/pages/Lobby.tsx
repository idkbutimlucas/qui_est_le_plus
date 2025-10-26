import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { QuestionCategory, categoryLabels } from '../types';

export default function Lobby() {
  const { room, socket, updateSettings, startGame, leaveRoom } = useSocket();
  const navigate = useNavigate();
  const [showSettings, setShowSettings] = useState(false);
  const [numberOfQuestions, setNumberOfQuestions] = useState(10);
  const [selectedCategories, setSelectedCategories] = useState<QuestionCategory[]>(['classique']);

  const isHost = room?.players.find((p) => p.id === socket?.id)?.isHost;

  useEffect(() => {
    if (!room) {
      navigate('/');
      return;
    }

    // Mettre à jour les settings locaux quand la room change
    setNumberOfQuestions(room.settings.numberOfQuestions);
    setSelectedCategories(room.settings.categories as QuestionCategory[]);

    // Rediriger vers le jeu si le jeu démarre
    if (room.status === 'playing') {
      navigate('/game');
    }
  }, [room, navigate]);

  const handleCategoryToggle = (category: QuestionCategory) => {
    const newCategories = selectedCategories.includes(category)
      ? selectedCategories.filter((c) => c !== category)
      : [...selectedCategories, category];

    if (newCategories.length > 0) {
      setSelectedCategories(newCategories);
      updateSettings({
        numberOfQuestions,
        categories: newCategories,
      });
    }
  };

  const handleNumberOfQuestionsChange = (value: number) => {
    setNumberOfQuestions(value);
    updateSettings({
      numberOfQuestions: value,
      categories: selectedCategories,
    });
  };

  const handleStartGame = () => {
    if (room && room.players.length >= 2) {
      startGame();
    }
  };

  const handleLeaveRoom = () => {
    leaveRoom();
    navigate('/');
  };

  if (!room) {
    return null;
  }

  const categories: QuestionCategory[] = ['soft', 'classique', 'humour-noir', 'hard', 'politiquement-incorrect'];

  const categoryColors: Record<QuestionCategory, string> = {
    'soft': 'bg-green-100 border-green-400 text-green-700',
    'classique': 'bg-blue-100 border-blue-400 text-blue-700',
    'humour-noir': 'bg-gray-100 border-gray-400 text-gray-700',
    'hard': 'bg-red-100 border-red-400 text-red-700',
    'politiquement-incorrect': 'bg-yellow-100 border-yellow-400 text-yellow-700',
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* En-tête */}
        <div className="bg-white rounded-3xl shadow-2xl p-6 mb-4 border-4 border-purple-300">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-playful text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                Lobby
              </h1>
              <p className="text-gray-600 font-cartoon mt-1">
                Code de la partie : <span className="font-bold text-2xl text-purple-600">{room.code}</span>
              </p>
            </div>
            <button
              onClick={handleLeaveRoom}
              className="bg-red-500 text-white font-cartoon py-2 px-4 rounded-xl hover:bg-red-600 transition"
            >
              Quitter
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Liste des joueurs */}
          <div className="bg-white rounded-3xl shadow-2xl p-6 border-4 border-pink-300">
            <h2 className="text-2xl font-playful text-pink-600 mb-4">
              Joueurs ({room.players.length})
            </h2>
            <div className="space-y-3">
              {room.players.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center space-x-3 bg-pink-50 p-3 rounded-xl border-2 border-pink-200"
                >
                  {player.avatar ? (
                    <img
                      src={player.avatar}
                      alt={player.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-pink-300"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-xl">
                      {player.name[0].toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-cartoon text-lg">{player.name}</p>
                    {player.isHost && (
                      <span className="text-xs bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full font-cartoon">
                        👑 Hôte
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Settings (visible seulement pour l'hôte) */}
          <div className="bg-white rounded-3xl shadow-2xl p-6 border-4 border-orange-300">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-playful text-orange-600">
                Paramètres
              </h2>
              {isHost && (
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="text-sm bg-orange-500 text-white px-3 py-1 rounded-full font-cartoon hover:bg-orange-600 transition"
                >
                  {showSettings ? 'Masquer' : 'Modifier'}
                </button>
              )}
            </div>

            {/* Nombre de questions */}
            <div className="mb-4">
              <label className="block text-gray-700 font-cartoon mb-2">
                Nombre de questions : <span className="font-bold text-orange-600">{numberOfQuestions}</span>
              </label>
              {isHost && showSettings ? (
                <input
                  type="range"
                  min="5"
                  max="30"
                  step="5"
                  value={numberOfQuestions}
                  onChange={(e) => handleNumberOfQuestionsChange(parseInt(e.target.value))}
                  className="w-full"
                />
              ) : (
                <div className="bg-orange-100 px-4 py-2 rounded-xl border-2 border-orange-200 font-cartoon">
                  {numberOfQuestions} questions
                </div>
              )}
            </div>

            {/* Catégories */}
            <div>
              <label className="block text-gray-700 font-cartoon mb-2">
                Catégories
              </label>
              <div className="space-y-2">
                {categories.map((category) => (
                  <div key={category}>
                    {isHost && showSettings ? (
                      <button
                        onClick={() => handleCategoryToggle(category)}
                        className={`w-full px-4 py-2 rounded-xl border-2 font-cartoon transition ${
                          selectedCategories.includes(category)
                            ? categoryColors[category]
                            : 'bg-gray-50 border-gray-200 text-gray-400'
                        }`}
                      >
                        {selectedCategories.includes(category) ? '✓ ' : ''}
                        {categoryLabels[category]}
                      </button>
                    ) : (
                      selectedCategories.includes(category) && (
                        <div className={`px-4 py-2 rounded-xl border-2 font-cartoon ${categoryColors[category]}`}>
                          {categoryLabels[category]}
                        </div>
                      )
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bouton démarrer */}
        {isHost && (
          <div className="mt-4 bg-white rounded-3xl shadow-2xl p-6 border-4 border-green-300">
            <button
              onClick={handleStartGame}
              disabled={room.players.length < 2}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white font-cartoon text-2xl py-4 px-6 rounded-2xl hover:scale-105 transform transition shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {room.players.length < 2
                ? '⏳ En attente de joueurs... (minimum 2)'
                : '🎮 Démarrer la partie !'}
            </button>
          </div>
        )}

        {!isHost && (
          <div className="mt-4 bg-white rounded-3xl shadow-2xl p-6 border-4 border-blue-300">
            <p className="text-center text-gray-600 font-cartoon text-lg">
              ⏳ En attente que l'hôte démarre la partie...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
