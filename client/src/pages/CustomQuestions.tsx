import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';

export default function CustomQuestions() {
  const { room, socket } = useSocket();
  const navigate = useNavigate();
  const [currentAdjective, setCurrentAdjective] = useState('');
  const [customQuestions, setCustomQuestions] = useState<string[]>([]);

  const isHost = room?.players.find((p) => p.id === socket?.id)?.isHost;
  const numberOfQuestions = room?.settings.numberOfQuestions || 10;
  const questionsCompleted = customQuestions.length;
  const isComplete = questionsCompleted >= numberOfQuestions;

  useEffect(() => {
    if (!room) {
      navigate('/');
      return;
    }

    if (room.status === 'playing') {
      navigate('/game');
      return;
    }

    if (room.status === 'lobby') {
      navigate('/lobby');
      return;
    }

    if (room.customQuestions) {
      setCustomQuestions(room.customQuestions);
    }
  }, [room, navigate]);

  useEffect(() => {
    if (!socket) return;

    socket.on('custom:questionsUpdated', (questions: string[]) => {
      setCustomQuestions(questions);
    });

    return () => {
      socket.off('custom:questionsUpdated');
    };
  }, [socket]);

  const handleAddQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAdjective.trim() || !socket) return;

    socket.emit('custom:addQuestion', currentAdjective.trim());
    setCurrentAdjective('');
  };

  const handleRemoveQuestion = (index: number) => {
    if (!socket) return;
    socket.emit('custom:removeQuestion', index);
  };

  const handleStartGame = () => {
    if (!socket || !isHost || !isComplete) return;
    socket.emit('custom:startGame');
  };

  if (!room) {
    return null;
  }

  return (
    <div className="neo-container h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Forme décorative */}
      <div className="fixed top-20 right-20 w-32 h-32 organic-shape-2 bg-accent opacity-10 animate-float-soft"></div>

      {/* Indicateur */}
      <div className="fixed top-6 left-6 z-20 animate-slide-in">
        <div className="neo-card px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="neo-indicator"></div>
            <p className="text-sm font-semibold text-primary">
              ✏️ Questions personnalisées
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl w-full h-full relative z-10 animate-scale-in flex flex-col py-4">
        {/* En-tête */}
        <div className="neo-card p-4 mb-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-primary mb-2">
                Créez vos questions
              </h1>
              <p className="text-secondary font-medium text-sm">
                Tous les joueurs peuvent ajouter des adjectifs
              </p>
            </div>
            <div className="neo-badge text-sm">
              {questionsCompleted} / {numberOfQuestions}
            </div>
          </div>
        </div>

        {/* Formulaire d'ajout */}
        <div className="neo-card p-4 mb-4 flex-shrink-0">
          <form onSubmit={handleAddQuestion}>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary text-sm font-medium">
                  Qui est le plus
                </span>
                <input
                  type="text"
                  value={currentAdjective}
                  onChange={(e) => setCurrentAdjective(e.target.value)}
                  placeholder="drôle..."
                  disabled={isComplete}
                  className="neo-input w-full pl-36 pr-10 text-primary font-medium text-sm"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary text-base font-medium">
                  ?
                </span>
              </div>
              <button
                type="submit"
                disabled={!currentAdjective.trim() || isComplete}
                className="neo-button-accent px-6 py-3 text-sm font-semibold text-white"
              >
                +
              </button>
            </div>
          </form>
        </div>

        {/* Liste des questions */}
        <div className="neo-card p-4 mb-4 flex flex-col flex-1 min-h-0">
          <h2 className="text-xl font-bold text-primary mb-3 flex-shrink-0">
            Questions créées
          </h2>
          {customQuestions.length === 0 ? (
            <div className="neo-pressed p-4 text-center">
              <p className="text-secondary font-medium text-sm">
                Aucune question pour le moment
              </p>
            </div>
          ) : (
            <div className="neo-scroll-container flex-1 overflow-y-auto">
              <div className="space-y-2 pr-2">
              {customQuestions.map((adjective, index) => (
                <div
                  key={index}
                  className="neo-card p-3 flex items-center justify-between hover-lift"
                >
                  <p className="font-semibold text-sm text-primary">
                    {index + 1}. Qui est le plus <span className="text-accent font-bold">{adjective}</span> ?
                  </p>
                  <button
                    onClick={() => handleRemoveQuestion(index)}
                    className="neo-button p-2 text-red-500 hover:text-red-600 text-sm"
                  >
                    ✕
                  </button>
                </div>
              ))}
              </div>
            </div>
          )}
        </div>

        {/* Bouton démarrer */}
        {isHost ? (
          <div className="neo-card p-4 flex-shrink-0">
            <button
              onClick={handleStartGame}
              disabled={!isComplete}
              className="w-full neo-button-accent py-4 px-6 text-xl font-bold text-white"
            >
              <div className="flex items-center justify-center gap-2">
                {isComplete ? (
                  <>
                    <span className="text-2xl">🎮</span>
                    <span>Démarrer la partie</span>
                  </>
                ) : (
                  <>
                    <span className="text-2xl">⏳</span>
                    <span>En attente de {numberOfQuestions - questionsCompleted} question{numberOfQuestions - questionsCompleted > 1 ? 's' : ''}</span>
                  </>
                )}
              </div>
            </button>
          </div>
        ) : (
          <div className="neo-card p-4 flex-shrink-0">
            <p className="text-center text-primary font-bold text-base flex items-center justify-center gap-2">
              {isComplete ? (
                <>
                  <span className="text-2xl">✅</span>
                  <span>En attente de l'hôte...</span>
                </>
              ) : (
                <>
                  <span className="text-2xl animate-pulse-soft">✏️</span>
                  <span>Continuez à ajouter !</span>
                </>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
