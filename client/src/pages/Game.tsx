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

  // Compter les votes en incluant le vote local s'il n'est pas encore synchronisé
  const serverVotedCount = Object.keys(room.votes).length;
  const hasLocalVoteNotSynced = hasVoted && socket?.id && !room.votes[socket.id];
  const votedCount = hasLocalVoteNotSynced ? serverVotedCount + 1 : serverVotedCount;

  const totalPlayers = room.players.length;
  const waitingFor = room.players.filter(p => {
    // Exclure le joueur courant s'il a voté localement mais pas encore synchronisé
    if (socket?.id === p.id && hasVoted) return false;
    return !room.votes[p.id];
  });
  const progressPercentage = (votedCount / totalPlayers) * 100;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-white">
      {/* Indicateurs esthétiques dans les coins */}
      <div className="fixed top-6 left-6 z-20">
        <div className="bg-white rounded-2xl px-4 py-2.5 border border-gray-300">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-black"></div>
            <p className="text-sm text-black font-semibold font-grotesk tracking-wide">
              Q {room.currentQuestionIndex + 1}<span className="text-gray-400 mx-1">/</span>{room.settings.numberOfQuestions}
            </p>
          </div>
          {/* Mini barre de progression */}
          <div className="mt-1.5 w-full bg-gray-200 rounded-full h-1 overflow-hidden">
            <div
              className="h-full bg-black transition-all duration-500"
              style={{
                width: `${((room.currentQuestionIndex + 1) / room.settings.numberOfQuestions) * 100}%`,
              }}
            ></div>
          </div>
        </div>
      </div>

      <div className="fixed top-6 right-6 z-20">
        <div className="bg-white rounded-2xl px-4 py-2.5 border border-gray-300">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
              votedCount === totalPlayers
                ? 'bg-black'
                : 'bg-black'
            }`}></div>
            <p className="text-sm text-black font-semibold font-grotesk tracking-wide">
              {votedCount}<span className="text-gray-400 mx-1">/</span>{totalPlayers}
              <span className="text-gray-600 ml-1 text-xs">votes</span>
            </p>
          </div>
          {/* Mini barre de progression des votes */}
          <div className="mt-1.5 w-full bg-gray-200 rounded-full h-1 overflow-hidden">
            <div
              className="h-full bg-black transition-all duration-500"
              style={{
                width: `${progressPercentage}%`,
              }}
            ></div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl w-full">

        {/* Question principale - Design épuré */}
        <div className="relative mb-6">
          <div className="glass-card rounded-2xl px-8 py-5">
            {/* Texte de la question */}
            <h1 className="text-3xl md:text-4xl font-bold text-center font-grotesk leading-snug text-black">
              {currentQuestion.text}
            </h1>
          </div>
        </div>

        {/* Grille de joueurs */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
          {room.players.map((player) => {
            const isCurrentPlayer = player.id === socket?.id;
            const isSelected = selectedPlayerId === player.id;

            return (
              <button
                key={player.id}
                onClick={() => handleVote(player.id)}
                disabled={!!currentResult}
                className={`
                  relative p-6 rounded-3xl transition-all duration-200
                  ${isSelected
                    ? 'bg-black text-white border border-black'
                    : 'bg-white border border-gray-300 hover:border-black cursor-pointer'
                  }
                  ${!!currentResult ? 'cursor-not-allowed opacity-60' : ''}
                `}
              >
                {/* Badge de sélection */}
                {isSelected && (
                  <div className="absolute -top-3 -right-3 bg-black text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-2xl z-10">
                    ✓
                  </div>
                )}

                {/* Avatar */}
                <div className="relative mb-4">
                  {player.avatar ? (
                    <div className="relative">
                      <img
                        src={player.avatar}
                        alt={player.name}
                        className={`w-24 h-24 mx-auto rounded-full object-cover transition-all
                          ${isSelected ? 'border-2 border-white' : 'border-2 border-gray-300'}
                        `}
                      />
                    </div>
                  ) : (
                    <div className={`w-24 h-24 mx-auto rounded-full bg-black flex items-center justify-center text-white font-bold text-4xl
                      ${isSelected ? 'border-2 border-white' : 'border-2 border-gray-300'}
                    `}>
                      {player.name[0].toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Nom du joueur */}
                <p className={`font-bold text-center text-lg font-grotesk transition-colors
                  ${isSelected ? 'text-white' : 'text-black'}
                `}>
                  {player.name}
                  {isCurrentPlayer && (
                    <span className={`block text-sm font-medium mt-1 ${isSelected ? 'text-white' : 'text-gray-600'}`}>
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
          <div className="glass-card rounded-3xl p-6">
            <div className="text-center mb-4">
              <p className="text-black font-semibold text-xl mb-2 font-grotesk flex items-center justify-center gap-2">
                <span className="text-2xl">⏳</span>
                <span>En attente des autres joueurs...</span>
              </p>
              <p className="text-gray-600 font-medium font-sans">
                💡 Vous pouvez changer votre vote en cliquant sur un autre joueur
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {waitingFor.map(player => (
                <span key={player.id} className="bg-gray-100 text-gray-800 border border-gray-300 px-4 py-2 rounded-full text-sm font-semibold font-sans">
                  {player.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Tous les votes sont là */}
        {votedCount === totalPlayers && (
          <div className="rounded-3xl">
            <div className="glass-card p-8 border border-gray-300 bg-white">
              <p className="text-center text-black font-bold text-3xl font-grotesk flex items-center justify-center gap-3">
                <span className="text-4xl">✨</span>
                <span>Tout le monde a voté ! Calcul des résultats...</span>
                <span className="text-4xl">✨</span>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
