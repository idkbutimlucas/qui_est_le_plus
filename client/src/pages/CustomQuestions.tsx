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

    // Synchroniser avec les questions custom de la room
    if (room.customQuestions) {
      setCustomQuestions(room.customQuestions);
    }
  }, [room, navigate]);

  useEffect(() => {
    if (!socket) return;

    // Écouter les mises à jour des questions custom
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

    // Envoyer l'adjectif au serveur
    socket.emit('custom:addQuestion', currentAdjective.trim());
    setCurrentAdjective('');
  };

  const handleRemoveQuestion = (index: number) => {
    if (!socket) return;

    // Créer une nouvelle liste sans la question supprimée
    const newQuestions = customQuestions.filter((_, i) => i !== index);

    // Mettre à jour sur le serveur
    // On va émettre chaque question restante
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-white">
      {/* Indicateur dans le coin */}
      <div className="fixed top-6 left-6 z-20">
        <div className="bg-white rounded-2xl px-4 py-2.5 border border-gray-300">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-black"></div>
            <p className="text-sm text-black font-semibold font-grotesk tracking-wide">
              ✏️ Questions personnalisées
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl w-full">
        {/* En-tête */}
        <div className="glass-card rounded-3xl p-6 mb-6">
          <h1 className="text-5xl font-bold text-black mb-4 font-grotesk">
            Créez vos questions
          </h1>
          <p className="text-gray-700 font-medium font-sans text-lg">
            Tous les joueurs peuvent ajouter des adjectifs pour personnaliser les questions.
          </p>
          <div className="mt-4">
            <div className="bg-gray-100 rounded-2xl px-5 py-3 inline-block">
              <p className="text-black font-bold font-grotesk text-xl">
                {questionsCompleted} / {numberOfQuestions} questions
              </p>
            </div>
          </div>
        </div>

        {/* Formulaire d'ajout */}
        <div className="glass-card rounded-3xl p-6 mb-6">
          <form onSubmit={handleAddQuestion} className="space-y-4">
            <div>
              <label className="block text-gray-700 font-semibold mb-3 font-grotesk text-lg">
                Ajouter un adjectif
              </label>
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 font-sans text-lg">
                    Qui est le plus
                  </span>
                  <input
                    type="text"
                    value={currentAdjective}
                    onChange={(e) => setCurrentAdjective(e.target.value)}
                    placeholder="drôle, intelligent, etc."
                    disabled={isComplete}
                    className="w-full pl-40 pr-5 py-4 rounded-2xl border border-gray-300 font-sans text-lg focus:outline-none focus:border-black disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                  <span className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 font-sans text-lg">
                    ?
                  </span>
                </div>
                <button
                  type="submit"
                  disabled={!currentAdjective.trim() || isComplete}
                  className="bg-black hover:bg-gray-800 text-white font-bold px-8 py-4 rounded-2xl transition-all duration-200 font-grotesk disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Ajouter
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Liste des questions */}
        <div className="glass-card rounded-3xl p-6 mb-6">
          <h2 className="text-3xl font-bold text-black mb-4 font-grotesk">
            Questions créées
          </h2>
          {customQuestions.length === 0 ? (
            <div className="bg-gray-50 rounded-2xl p-8 text-center">
              <p className="text-gray-500 font-sans text-lg">
                Aucune question ajoutée pour le moment
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {customQuestions.map((adjective, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-white p-4 rounded-2xl border border-gray-300"
                >
                  <p className="font-semibold text-lg font-sans text-black">
                    {index + 1}. Qui est le plus <span className="text-black font-bold">{adjective}</span> ?
                  </p>
                  <button
                    onClick={() => handleRemoveQuestion(index)}
                    className="bg-red-50 hover:bg-red-100 text-red-600 font-bold px-4 py-2 rounded-xl transition-all duration-200 font-sans text-sm border border-red-200"
                  >
                    Supprimer
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bouton démarrer */}
        {isHost ? (
          <div className="glass-card rounded-3xl p-6">
            <button
              onClick={handleStartGame}
              disabled={!isComplete}
              className="w-full bg-black hover:bg-gray-800 text-white font-bold text-2xl py-6 px-8 rounded-2xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-grotesk"
            >
              <div className="flex items-center justify-center gap-3">
                {isComplete ? (
                  <>
                    <span className="text-3xl">🎮</span>
                    <span>Démarrer la partie !</span>
                  </>
                ) : (
                  <>
                    <span className="text-3xl">⏳</span>
                    <span>En attente de {numberOfQuestions - questionsCompleted} question{numberOfQuestions - questionsCompleted > 1 ? 's' : ''}...</span>
                  </>
                )}
              </div>
            </button>
          </div>
        ) : (
          <div className="glass-card rounded-3xl p-6">
            <p className="text-center text-black font-semibold text-xl font-grotesk flex items-center justify-center gap-3">
              {isComplete ? (
                <>
                  <span className="text-3xl">✅</span>
                  <span>En attente que l'hôte démarre la partie...</span>
                </>
              ) : (
                <>
                  <span className="text-3xl">✏️</span>
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
