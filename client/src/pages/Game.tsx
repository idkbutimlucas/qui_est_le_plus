import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';

export default function Game() {
  const { room, currentQuestion, currentResult, socket, vote } = useSocket();
  const navigate = useNavigate();
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);

  useEffect(() => {
    if (!room) {
      navigate('/');
      return;
    }

    if (room.status === 'lobby') {
      navigate('/lobby');
      return;
    }

    if (room.status === 'custom-questions') {
      navigate('/custom-questions');
      return;
    }

    if (room.status === 'finished') {
      navigate('/results');
      return;
    }

    if (socket?.id && room.votes[socket.id]) {
      setHasVoted(true);
      setSelectedPlayerId(room.votes[socket.id]);
    } else {
      setHasVoted(false);
      setSelectedPlayerId(null);
    }
  }, [room, navigate, socket]);

  useEffect(() => {
    if (currentResult) {
      setTimeout(() => {
        navigate('/vote-reveal');
      }, 500);
    }
  }, [currentResult, navigate]);

  const handleVote = (playerId: string) => {
    if (!currentResult) {
      setSelectedPlayerId(playerId);
      vote(playerId);
      setHasVoted(true);
    }
  };

  if (!room || !currentQuestion) {
    return null;
  }

  const serverVotedCount = Object.keys(room.votes).length;
  const hasLocalVoteNotSynced = hasVoted && socket?.id && !room.votes[socket.id];
  const votedCount = hasLocalVoteNotSynced ? serverVotedCount + 1 : serverVotedCount;

  const totalPlayers = room.players.length;
  const waitingFor = room.players.filter(p => {
    if (socket?.id === p.id && hasVoted) return false;
    return !room.votes[p.id];
  });
  const progressPercentage = (votedCount / totalPlayers) * 100;

  return (
    <div className="neo-container min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Indicateurs dans les coins */}
      <div className="fixed top-6 left-6 z-20 animate-slide-in">
        <div className="neo-card px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="neo-indicator"></div>
            <p className="text-sm font-semibold text-primary">
              Question {room.currentQuestionIndex + 1} / {room.settings.numberOfQuestions}
            </p>
          </div>
          <div className="neo-progress-bar h-2 mt-2">
            <div
              className="neo-progress-fill"
              style={{
                width: `${((room.currentQuestionIndex + 1) / room.settings.numberOfQuestions) * 100}%`,
              }}
            ></div>
          </div>
        </div>
      </div>

      <div className="fixed top-6 right-6 z-20 animate-slide-in" style={{ animationDelay: '0.1s' }}>
        <div className="neo-card px-4 py-3">
          <div className="flex items-center gap-3">
            <div className={`neo-indicator ${votedCount === totalPlayers ? 'animate-glow-soft' : ''}`}></div>
            <p className="text-sm font-semibold text-primary">
              {votedCount} / {totalPlayers} votes
            </p>
          </div>
          <div className="neo-progress-bar h-2 mt-2">
            <div
              className="neo-progress-fill"
              style={{
                width: `${progressPercentage}%`,
              }}
            ></div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl w-full relative z-10">
        {/* Question principale */}
        <div className="neo-card p-8 mb-8 animate-scale-in organic-shape-1">
          <h1 className="text-3xl md:text-4xl font-bold text-center text-primary leading-tight">
            {currentQuestion.text}
          </h1>
        </div>

        {/* Grille de joueurs */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-6">
          {room.players.map((player, index) => {
            const isCurrentPlayer = player.id === socket?.id;
            const isSelected = selectedPlayerId === player.id;

            return (
              <button
                key={player.id}
                onClick={() => handleVote(player.id)}
                disabled={!!currentResult}
                className={`neo-card p-5 transition-all duration-300 animate-slide-in hover-lift ${
                  isSelected
                    ? 'animate-glow-soft'
                    : ''
                } ${!!currentResult ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {isSelected && (
                  <div className="absolute -top-3 -right-3 neo-button-accent w-12 h-12 rounded-full flex items-center justify-center font-black text-2xl z-10 text-white">
                    ✓
                  </div>
                )}

                {/* Avatar */}
                <div className="mb-4">
                  {player.avatar ? (
                    <div className="neo-avatar mx-auto w-24 h-24">
                      <img
                        src={player.avatar}
                        alt={player.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="neo-avatar mx-auto w-24 h-24 flex items-center justify-center">
                      <div className="bg-accent-gradient w-full h-full flex items-center justify-center text-white font-bold text-4xl" style={{ borderRadius: 'inherit' }}>
                        {player.name[0].toUpperCase()}
                      </div>
                    </div>
                  )}
                </div>

                {/* Nom du joueur */}
                <p className={`font-bold text-center text-base ${isSelected ? 'text-accent' : 'text-primary'}`}>
                  {player.name}
                  {isCurrentPlayer && (
                    <span className="block text-xs text-secondary mt-1">
                      (Toi)
                    </span>
                  )}
                </p>
              </button>
            );
          })}
        </div>

        {/* Info en attente */}
        {hasVoted && votedCount < totalPlayers && (
          <div className="neo-card p-6 animate-slide-in">
            <div className="text-center mb-4">
              <p className="text-primary font-bold text-xl mb-3 flex items-center justify-center gap-2">
                <span className="text-2xl animate-pulse-soft">⏳</span>
                <span>En attente des autres joueurs...</span>
              </p>
              <p className="text-secondary font-semibold text-sm">
                💡 Tu peux changer ton vote si besoin
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {waitingFor.map(player => (
                <span key={player.id} className="neo-pressed px-4 py-2 text-sm font-semibold text-primary">
                  {player.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Tous les votes sont là */}
        {votedCount === totalPlayers && (
          <div className="neo-card p-8 animate-scale-in">
            <p className="text-center text-primary font-bold text-3xl flex items-center justify-center gap-4">
              <span className="text-4xl animate-pulse-soft">✨</span>
              <span>Calcul en cours...</span>
              <span className="text-4xl animate-pulse-soft">✨</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
