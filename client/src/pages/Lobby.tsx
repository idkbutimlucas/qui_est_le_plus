import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { QuestionCategory, categoryLabels } from '../types';

export default function Lobby() {
  const { room, socket, updateSettings, startGame, leaveRoom, kickPlayer, regenerateCode } = useSocket();
  const navigate = useNavigate();
  const [showSettings, setShowSettings] = useState(false);
  const [numberOfQuestions, setNumberOfQuestions] = useState(10);
  const [selectedCategories, setSelectedCategories] = useState<QuestionCategory[]>(['classique']);
  const [showCode, setShowCode] = useState(true);
  const [copied, setCopied] = useState(false);

  const isHost = room?.players.find((p) => p.id === socket?.id)?.isHost;

  const handleKickPlayer = (playerId: string) => {
    if (window.confirm('Voulez-vous vraiment expulser ce joueur ?')) {
      kickPlayer(playerId);
    }
  };

  const handleRegenerateCode = () => {
    if (window.confirm('Voulez-vous vraiment générer un nouveau code ? L\'ancien code ne fonctionnera plus.')) {
      regenerateCode();
      setShowCode(true);
    }
  };

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
    <div className="neo-container h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Formes décoratives */}
      <div className="fixed top-10 left-10 w-32 h-32 organic-shape-2 bg-accent opacity-10 animate-float-soft"></div>
      <div className="fixed bottom-20 right-16 w-40 h-40 organic-shape-3 bg-accent-secondary opacity-10 animate-pulse-soft"></div>

      <div className="max-w-6xl w-full h-full relative z-10 animate-scale-in flex flex-col py-4">
        {/* En-tête */}
        <div className="neo-card p-4 mb-4 flex-shrink-0">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-3 text-primary" style={{ fontFamily: 'Papernotes, sans-serif' }}>
                Lobby
              </h1>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="neo-badge text-xs">
                  Code
                </div>
                <div className="flex items-center gap-2">
                  <div className="neo-card px-4 py-2">
                    <span className="font-mono text-xl font-bold text-accent tracking-wider">
                      {showCode ? room.code : '••••••'}
                    </span>
                  </div>

                  {isHost && (
                    <button
                      onClick={handleRegenerateCode}
                      className="neo-button p-2"
                      title="Générer un nouveau code"
                    >
                      <span className="text-base">🔄</span>
                    </button>
                  )}

                  <button
                    onClick={() => setShowCode(!showCode)}
                    className="neo-button p-2"
                    title={showCode ? 'Cacher le code' : 'Afficher le code'}
                  >
                    <span className="text-base">{showCode ? '👁️' : '👁️‍🗨️'}</span>
                  </button>

                  <button
                    onClick={copyCode}
                    className={`neo-button px-3 py-2 text-sm font-semibold transition-all ${copied ? 'animate-pulse-soft' : ''}`}
                    title="Copier le code"
                  >
                    {copied ? '✓' : '📋'}
                  </button>
                </div>
              </div>
            </div>
            <button
              onClick={handleLeaveRoom}
              className="neo-button px-4 py-2 text-sm font-semibold text-primary hover-lift"
            >
              ✕ Quitter
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4 flex-1 min-h-0">
          {/* Liste des joueurs */}
          <div className="neo-card p-4 flex flex-col">
            <div className="flex items-center justify-between mb-3 flex-shrink-0">
              <h2 className="text-xl font-bold text-primary" style={{ fontFamily: 'Papernotes, sans-serif' }}>
                Joueurs
              </h2>
              <div className="neo-badge text-sm">
                {room.players.length}
              </div>
            </div>
            <div className="neo-scroll-container flex-1 overflow-y-auto">
              <div className="space-y-3 pr-2">
              {room.players.map((player) => (
                <div
                  key={player.id}
                  className="neo-card p-3 hover-lift flex items-center gap-3"
                >
                  {player.avatar ? (
                    <div className="neo-avatar w-12 h-12">
                      <img
                        src={player.avatar}
                        alt={player.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="neo-avatar w-12 h-12 flex items-center justify-center">
                      <div className="bg-accent-gradient w-full h-full flex items-center justify-center text-white font-bold text-lg" style={{ borderRadius: 'inherit' }}>
                        {player.name[0].toUpperCase()}
                      </div>
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-bold text-base text-primary">{player.name}</p>
                    {player.isHost && (
                      <span className="neo-badge text-xs">
                        👑 Hôte
                      </span>
                    )}
                  </div>
                  {isHost && !player.isHost && (
                    <button
                      onClick={() => handleKickPlayer(player.id)}
                      className="neo-button p-2 text-red-500 hover:text-red-600"
                      title="Expulser ce joueur"
                    >
                      <span className="text-sm">✕</span>
                    </button>
                  )}
                </div>
              ))}
              </div>
            </div>
          </div>

          {/* Settings */}
          <div className="neo-card p-4 flex flex-col">
            <div className="flex justify-between items-center mb-3 flex-shrink-0">
              <h2 className="text-xl font-bold text-primary" style={{ fontFamily: 'Papernotes, sans-serif' }}>
                Paramètres
              </h2>
              {isHost && (
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="neo-button-accent px-3 py-2 text-xs font-semibold text-white"
                >
                  {showSettings ? '✕' : '⚙️'}
                </button>
              )}
            </div>

            {/* Nombre de questions */}
            <div className="mb-4 flex-shrink-0">
              <div className="flex items-center gap-2 mb-2">
                <div className="neo-badge text-xs">
                  Questions
                </div>
                <span className="text-2xl font-bold text-accent">{numberOfQuestions}</span>
              </div>
              {isHost && showSettings ? (
                <div className="space-y-2">
                  <input
                    type="range"
                    min="5"
                    max="30"
                    step="5"
                    value={numberOfQuestions}
                    onChange={(e) => handleNumberOfQuestionsChange(parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-secondary font-semibold">
                    <span>5</span>
                    <span>15</span>
                    <span>30</span>
                  </div>
                </div>
              ) : (
                <div className="neo-pressed px-4 py-2 text-sm font-semibold text-primary">
                  {numberOfQuestions} questions
                </div>
              )}
            </div>

            {/* Catégories */}
            <div className="flex flex-col flex-1 min-h-0">
              <div className="neo-badge text-xs mb-2 inline-block flex-shrink-0">
                Catégories
              </div>
              <div className="neo-scroll-container flex-1 overflow-y-auto">
                <div className="space-y-2 pr-2">
                {categories.map((category) => (
                  <div key={category}>
                    {isHost && showSettings ? (
                      <button
                        onClick={() => handleCategoryToggle(category)}
                        className={`w-full px-4 py-2 text-sm font-semibold transition-all hover-lift ${
                          selectedCategories.includes(category)
                            ? 'neo-button-accent text-white'
                            : 'neo-button text-primary'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{categoryLabels[category]}</span>
                          {selectedCategories.includes(category) && <span className="text-base">✓</span>}
                        </div>
                      </button>
                    ) : (
                      selectedCategories.includes(category) && (
                        <div className="neo-pressed px-4 py-2 text-sm font-semibold text-primary">
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
        </div>

        {/* Bouton démarrer */}
        {isHost && (
          <div className="neo-card p-4 flex-shrink-0">
            <button
              onClick={handleStartGame}
              disabled={room.players.length < 2}
              className="w-full neo-button-accent py-4 px-6 text-xl font-bold text-white"
            >
              <div className="flex items-center justify-center gap-3">
                {room.players.length < 2 ? (
                  <>
                    <span className="text-2xl">⏳</span>
                    <span>En attente (min 2 joueurs)</span>
                  </>
                ) : (
                  <>
                    <span className="text-2xl">🎮</span>
                    <span>Démarrer la partie</span>
                  </>
                )}
              </div>
            </button>
          </div>
        )}

        {!isHost && (
          <div className="neo-card p-4 flex-shrink-0">
            <p className="text-center text-primary font-bold text-lg flex items-center justify-center gap-3">
              <span className="text-2xl animate-pulse-soft">⏳</span>
              <span>En attente de l'hôte...</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
