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
    <div className="neo-container min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Formes décoratives */}
      <div className="fixed top-10 left-10 w-32 h-32 organic-shape-2 bg-accent opacity-10 animate-float-soft"></div>
      <div className="fixed bottom-20 right-16 w-40 h-40 organic-shape-3 bg-accent-secondary opacity-10 animate-pulse-soft"></div>

      <div className="max-w-6xl w-full relative z-10 animate-scale-in">
        {/* En-tête */}
        <div className="neo-card p-8 mb-8">
          <div className="flex justify-between items-center flex-wrap gap-6">
            <div className="flex-1">
              <h1 className="text-5xl font-bold mb-6 text-primary" style={{ fontFamily: 'Papernotes, sans-serif' }}>
                Lobby
              </h1>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="neo-badge">
                  Code de la partie
                </div>
                <div className="flex items-center gap-3">
                  <div className="neo-card px-6 py-3 organic-shape-1">
                    <span className="font-mono text-3xl font-bold text-accent tracking-[0.3em]">
                      {showCode ? room.code : '••••••'}
                    </span>
                  </div>

                  {isHost && (
                    <button
                      onClick={handleRegenerateCode}
                      className="neo-button p-3"
                      title="Générer un nouveau code"
                    >
                      <span className="text-xl">🔄</span>
                    </button>
                  )}

                  <button
                    onClick={() => setShowCode(!showCode)}
                    className="neo-button p-3"
                    title={showCode ? 'Cacher le code' : 'Afficher le code'}
                  >
                    <span className="text-xl">{showCode ? '👁️' : '👁️‍🗨️'}</span>
                  </button>

                  <button
                    onClick={copyCode}
                    className={`neo-button px-5 py-3 font-semibold transition-all ${copied ? 'animate-pulse-soft' : ''}`}
                    title="Copier le code"
                  >
                    <div className="flex items-center gap-2">
                      {copied ? (
                        <>
                          <span>✓</span>
                          <span>Copié</span>
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
              className="neo-button px-6 py-3 font-semibold text-primary hover-lift"
            >
              ✕ Quitter
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Liste des joueurs */}
          <div className="neo-card p-7">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-primary" style={{ fontFamily: 'Papernotes, sans-serif' }}>
                Joueurs
              </h2>
              <div className="neo-badge text-lg">
                {room.players.length}
              </div>
            </div>
            <div className="neo-scroll-container max-h-96 overflow-y-auto">
              <div className="space-y-4 pr-2">
              {room.players.map((player) => (
                <div
                  key={player.id}
                  className="neo-card p-5 hover-lift flex items-center gap-4"
                >
                  {player.avatar ? (
                    <div className="neo-avatar w-16 h-16">
                      <img
                        src={player.avatar}
                        alt={player.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="neo-avatar w-16 h-16 flex items-center justify-center">
                      <div className="bg-accent-gradient w-full h-full flex items-center justify-center text-white font-bold text-2xl" style={{ borderRadius: 'inherit' }}>
                        {player.name[0].toUpperCase()}
                      </div>
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-bold text-lg text-primary">{player.name}</p>
                    {player.isHost && (
                      <span className="neo-badge text-xs">
                        <span>👑</span>
                        <span className="ml-1">Hôte</span>
                      </span>
                    )}
                  </div>
                  {isHost && !player.isHost && (
                    <button
                      onClick={() => handleKickPlayer(player.id)}
                      className="neo-button p-3 text-red-500 hover:text-red-600"
                      title="Expulser ce joueur"
                    >
                      <span className="text-lg">✕</span>
                    </button>
                  )}
                </div>
              ))}
              </div>
            </div>
          </div>

          {/* Settings */}
          <div className="neo-card p-7">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-primary" style={{ fontFamily: 'Papernotes, sans-serif' }}>
                Paramètres
              </h2>
              {isHost && (
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="neo-button-accent px-6 py-3 font-semibold text-white"
                >
                  {showSettings ? '✕ Masquer' : '⚙️ Modifier'}
                </button>
              )}
            </div>

            {/* Nombre de questions */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="neo-badge text-sm">
                  Questions
                </div>
                <span className="text-4xl font-bold text-accent">{numberOfQuestions}</span>
              </div>
              {isHost && showSettings ? (
                <div className="space-y-3">
                  <div className="neo-progress-bar h-6">
                    <div
                      className="neo-progress-fill"
                      style={{ width: `${((numberOfQuestions - 5) / 25) * 100}%` }}
                    ></div>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="30"
                    step="5"
                    value={numberOfQuestions}
                    onChange={(e) => handleNumberOfQuestionsChange(parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-secondary font-semibold">
                    <span>5</span>
                    <span>10</span>
                    <span>15</span>
                    <span>20</span>
                    <span>25</span>
                    <span>30</span>
                  </div>
                </div>
              ) : (
                <div className="neo-pressed px-6 py-4 font-semibold text-primary">
                  {numberOfQuestions} questions
                </div>
              )}
            </div>

            {/* Catégories */}
            <div>
              <div className="neo-badge text-sm mb-4 inline-block">
                Catégories
              </div>
              <div className="neo-scroll-container max-h-64 overflow-y-auto">
                <div className="space-y-3 pr-2">
                {categories.map((category) => (
                  <div key={category}>
                    {isHost && showSettings ? (
                      <button
                        onClick={() => handleCategoryToggle(category)}
                        className={`w-full px-6 py-4 font-semibold transition-all hover-lift ${
                          selectedCategories.includes(category)
                            ? 'neo-button-accent text-white'
                            : 'neo-button text-primary'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{categoryLabels[category]}</span>
                          {selectedCategories.includes(category) && <span className="text-xl">✓</span>}
                        </div>
                      </button>
                    ) : (
                      selectedCategories.includes(category) && (
                        <div className="neo-pressed px-6 py-4 font-semibold text-primary">
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
          <div className="neo-card p-8">
            <button
              onClick={handleStartGame}
              disabled={room.players.length < 2}
              className="w-full neo-button-accent py-8 px-10 text-3xl font-bold text-white"
            >
              <div className="flex items-center justify-center gap-4">
                {room.players.length < 2 ? (
                  <>
                    <span className="text-4xl">⏳</span>
                    <span>En attente (min 2 joueurs)</span>
                  </>
                ) : (
                  <>
                    <span className="text-5xl">🎮</span>
                    <span>Démarrer la partie</span>
                  </>
                )}
              </div>
            </button>
          </div>
        )}

        {!isHost && (
          <div className="neo-card p-8">
            <p className="text-center text-primary font-bold text-2xl flex items-center justify-center gap-4">
              <span className="text-4xl animate-pulse-soft">⏳</span>
              <span>En attente de l'hôte...</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
