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
    <div className="neo-container min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
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

      <div className="max-w-4xl w-full relative z-10 animate-scale-in">
        {/* En-tête */}
        <div className="neo-card p-6 mb-6">
          <h1 className="text-4xl font-bold text-primary mb-4">
            Créez vos questions
          </h1>
          <p className="text-secondary font-medium text-base">
            Tous les joueurs peuvent ajouter des adjectifs
          </p>
          <div className="mt-4">
            <div className="neo-badge text-lg">
              {questionsCompleted} / {numberOfQuestions} questions
            </div>
          </div>
        </div>

        {/* Formulaire d'ajout */}
        <div className="neo-card p-6 mb-6">
          <form onSubmit={handleAddQuestion} className="space-y-4">
            <div>
              <label className="block text-secondary font-semibold mb-3 text-lg">
                Ajouter un adjectif
              </label>
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-secondary text-base font-medium">
                    Qui est le plus
                  </span>
                  <input
                    type="text"
                    value={currentAdjective}
                    onChange={(e) => setCurrentAdjective(e.target.value)}
                    placeholder="drôle, intelligent..."
                    disabled={isComplete}
                    className="neo-input w-full pl-48 pr-12 text-primary font-medium"
                  />
                  <span className="absolute right-5 top-1/2 -translate-y-1/2 text-secondary text-lg font-medium">
                    ?
                  </span>
                </div>
                <button
                  type="submit"
                  disabled={!currentAdjective.trim() || isComplete}
                  className="neo-button-accent px-8 py-4 font-semibold text-white"
                >
                  Ajouter
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Liste des questions */}
        <div className="neo-card p-6 mb-6">
          <h2 className="text-3xl font-bold text-primary mb-4">
            Questions créées
          </h2>
          {customQuestions.length === 0 ? (
            <div className="neo-pressed p-8 text-center">
              <p className="text-secondary font-medium text-base">
                Aucune question pour le moment
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {customQuestions.map((adjective, index) => (
                <div
                  key={index}
                  className="neo-card p-4 flex items-center justify-between hover-lift animate-slide-in"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <p className="font-semibold text-base text-primary">
                    {index + 1}. Qui est le plus <span className="text-accent font-bold">{adjective}</span> ?
                  </p>
                  <button
                    onClick={() => handleRemoveQuestion(index)}
                    className="neo-button p-3 text-red-500 hover:text-red-600"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bouton démarrer */}
        {isHost ? (
          <div className="neo-card p-6">
            <button
              onClick={handleStartGame}
              disabled={!isComplete}
              className="w-full neo-button-accent py-6 px-8 text-2xl font-bold text-white"
            >
              <div className="flex items-center justify-center gap-3">
                {isComplete ? (
                  <>
                    <span className="text-3xl">🎮</span>
                    <span>Démarrer la partie</span>
                  </>
                ) : (
                  <>
                    <span className="text-3xl">⏳</span>
                    <span>En attente de {numberOfQuestions - questionsCompleted} question{numberOfQuestions - questionsCompleted > 1 ? 's' : ''}</span>
                  </>
                )}
              </div>
            </button>
          </div>
        ) : (
          <div className="neo-card p-6">
            <p className="text-center text-primary font-bold text-xl flex items-center justify-center gap-3">
              {isComplete ? (
                <>
                  <span className="text-3xl">✅</span>
                  <span>En attente de l'hôte...</span>
                </>
              ) : (
                <>
                  <span className="text-3xl animate-pulse-soft">✏️</span>
                  <span>Continuez à ajouter des questions !</span>
                </>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
