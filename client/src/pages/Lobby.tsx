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
  const [showCode, setShowCode] = useState(true);
  const [copied, setCopied] = useState(false);

  const isHost = room?.players.find((p) => p.id === socket?.id)?.isHost;

  const copyCode = () => {
    if (room) {
      navigator.clipboard.writeText(room.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  useEffect(() => {
    if (!room) {
      navigate('/');
      return;
    }

    setNumberOfQuestions(room.settings.numberOfQuestions);
    setSelectedCategories(room.settings.categories as QuestionCategory[]);

    if (room.status === 'custom-questions') {
      navigate('/custom-questions');
    } else if (room.status === 'playing') {
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

  const categories: QuestionCategory[] = ['soft', 'classique', 'humour-noir', 'hard', 'politiquement-incorrect', 'custom'];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-white">
      <div className="max-w-5xl w-full">
        {/* En-tête */}
        <div className="glass-card rounded-3xl p-6 mb-6">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div className="flex-1">
              <h1 className="text-5xl font-bold text-black mb-4 font-grotesk">
                Lobby
              </h1>
              <div className="flex items-center gap-3 flex-wrap">
                <p className="text-gray-700 font-medium font-sans">
                  Code de la partie :
                </p>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-3xl text-black font-mono tracking-widest">
                    {showCode ? room.code : '••••••'}
                  </span>

                  {/* Bouton afficher/cacher */}
                  <button
                    onClick={() => setShowCode(!showCode)}
                    className="bg-white hover:bg-gray-50 border border-gray-300 text-black font-semibold py-2 px-4 rounded-xl transition-all duration-200 font-sans text-sm"
                    title={showCode ? 'Cacher le code' : 'Afficher le code'}
                  >
                    {showCode ? '👁️' : '👁️‍🗨️'}
                  </button>

                  {/* Bouton copier */}
                  <button
                    onClick={copyCode}
                    className={`font-semibold py-2 px-4 rounded-xl transition-all duration-200 font-sans text-sm ${
                      copied
                        ? 'bg-black text-white'
                        : 'bg-black hover:bg-gray-800 text-white'
                    }`}
                    title="Copier le code"
                  >
                    <div className="flex items-center gap-2">
                      {copied ? (
                        <>
                          <span>✓</span>
                          <span>Copié !</span>
                        </>
                      ) : (
                        <>
                          <span>📋</span>
                          <span>Copier</span>
                        </>
                      )}
                    </div>
                  </button>
                </div>
              </div>
            </div>
            <button
              onClick={handleLeaveRoom}
              className="bg-white hover:bg-gray-50 text-black border border-gray-300 font-semibold py-3 px-6 rounded-xl transition-all duration-200 font-grotesk"
            >
              Quitter
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Liste des joueurs */}
          <div className="glass-card rounded-3xl p-6">
            <h2 className="text-3xl font-bold text-black mb-6 font-grotesk">
              Joueurs ({room.players.length})
            </h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {room.players.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-gray-300 transition-all duration-200"
                >
                  {player.avatar ? (
                    <div className="relative">
                      <img
                        src={player.avatar}
                        alt={player.name}
                        className="w-14 h-14 rounded-full object-cover border-2 border-black"
                      />
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-black flex items-center justify-center text-white font-bold text-2xl">
                      {player.name[0].toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-semibold text-lg font-grotesk text-black">{player.name}</p>
                    {player.isHost && (
                      <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-800 border border-gray-300 px-3 py-1 rounded-full font-semibold font-sans">
                        <span>👑</span>
                        <span>Hôte</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Settings */}
          <div className="glass-card rounded-3xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-black font-grotesk">
                Paramètres
              </h2>
              {isHost && (
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="text-sm bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-full font-semibold transition-all duration-200 font-sans"
                >
                  {showSettings ? 'Masquer' : 'Modifier'}
                </button>
              )}
            </div>

            {/* Nombre de questions */}
            <div className="mb-6">
              <label className="block text-gray-700 font-semibold mb-3 font-grotesk text-lg">
                Nombre de questions : <span className="text-black">{numberOfQuestions}</span>
              </label>
              {isHost && showSettings ? (
                <div className="space-y-2">
                  <input
                    type="range"
                    min="5"
                    max="30"
                    step="5"
                    value={numberOfQuestions}
                    onChange={(e) => handleNumberOfQuestionsChange(parseInt(e.target.value))}
                    className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black"
                  />
                  <div className="flex justify-between text-xs text-gray-500 font-sans">
                    <span>5</span>
                    <span>10</span>
                    <span>15</span>
                    <span>20</span>
                    <span>25</span>
                    <span>30</span>
                  </div>
                </div>
              ) : (
                <div className="bg-white px-5 py-3 rounded-2xl border border-gray-300 font-semibold text-black font-sans">
                  {numberOfQuestions} questions
                </div>
              )}
            </div>

            {/* Catégories */}
            <div>
              <label className="block text-gray-700 font-semibold mb-3 font-grotesk text-lg">
                Catégories
              </label>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {categories.map((category) => (
                  <div key={category}>
                    {isHost && showSettings ? (
                      <button
                        onClick={() => handleCategoryToggle(category)}
                        className={`w-full px-5 py-3 rounded-2xl border font-semibold transition-all duration-200 font-sans ${
                          selectedCategories.includes(category)
                            ? 'bg-black text-white border-black'
                            : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{categoryLabels[category]}</span>
                          {selectedCategories.includes(category) && <span className="text-lg">✓</span>}
                        </div>
                      </button>
                    ) : (
                      selectedCategories.includes(category) && (
                        <div className="px-5 py-3 rounded-2xl border border-gray-300 font-semibold font-sans bg-gray-100 text-gray-800">
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
          <div className="glass-card rounded-3xl p-6">
            <button
              onClick={handleStartGame}
              disabled={room.players.length < 2}
              className="w-full bg-black hover:bg-gray-800 text-white font-bold text-2xl py-6 px-8 rounded-2xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-grotesk"
            >
              <div className="flex items-center justify-center gap-3">
                {room.players.length < 2 ? (
                  <>
                    <span className="text-3xl">⏳</span>
                    <span>En attente de joueurs... (minimum 2)</span>
                  </>
                ) : (
                  <>
                    <span className="text-3xl">🎮</span>
                    <span>Démarrer la partie !</span>
                  </>
                )}
              </div>
            </button>
          </div>
        )}

        {!isHost && (
          <div className="glass-card rounded-3xl p-6">
            <p className="text-center text-black font-semibold text-xl font-grotesk flex items-center justify-center gap-3">
              <span className="text-3xl">⏳</span>
              <span>En attente que l'hôte démarre la partie...</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
