import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';

export default function Game() {
  const { room, currentQuestion, currentResult, socket, vote, nextQuestion } = useSocket();
  const navigate = useNavigate();
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);

  const isHost = room?.players.find((p) => p.id === socket?.id)?.isHost;

  useEffect(() => {
    if (!room) {
      navigate('/');
      return;
    }

    if (room.status === 'lobby') {
      navigate('/lobby');
      return;
    }

    if (room.status === 'finished') {
      navigate('/results');
      return;
    }

    // Vérifier si le joueur a déjà voté
    if (socket?.id && room.votes[socket.id]) {
      setHasVoted(true);
      setSelectedPlayerId(room.votes[socket.id]);
    } else {
      setHasVoted(false);
      setSelectedPlayerId(null);
    }
  }, [room, navigate, socket]);

  useEffect(() => {
    // Quand on passe à la page de résultats
    if (currentResult) {
      // Attendre un peu avant de montrer les résultats
      setTimeout(() => {
        navigate('/results');
      }, 500);
    }
  }, [currentResult, navigate]);

  const handleVote = (playerId: string) => {
    // Permettre de changer son vote tant que tout le monde n'a pas voté
    if (playerId !== socket?.id && !currentResult) {
      setSelectedPlayerId(playerId);
      vote(playerId);
      setHasVoted(true);
    }
  };

  if (!room || !currentQuestion) {
    return null;
  }

  const votedCount = Object.keys(room.votes).length;
  const totalPlayers = room.players.length;
  const waitingFor = room.players.filter(p => !room.votes[p.id]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* En-tête */}
        <div className="bg-white rounded-3xl shadow-2xl p-6 mb-4 border-4 border-purple-300">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-playful text-purple-600">
                Question {room.currentQuestionIndex + 1} / {room.settings.numberOfQuestions}
              </h2>
              <div className="mt-2 bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-full transition-all duration-500"
                  style={{
                    width: `${((room.currentQuestionIndex + 1) / room.settings.numberOfQuestions) * 100}%`,
                  }}
                />
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 font-cartoon">
                Votes : {votedCount} / {totalPlayers}
              </p>
            </div>
          </div>
        </div>

        {/* Question */}
        <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 rounded-3xl shadow-2xl p-8 mb-6 border-4 border-white">
          <h1 className="text-4xl md:text-5xl font-playful text-center text-white drop-shadow-lg">
            {currentQuestion.text}
          </h1>
        </div>

        {/* Grille de joueurs */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          {room.players.map((player) => {
            const isCurrentPlayer = player.id === socket?.id;
            const isSelected = selectedPlayerId === player.id;

            return (
              <button
                key={player.id}
                onClick={() => handleVote(player.id)}
                disabled={isCurrentPlayer || !!currentResult}
                className={`
                  relative p-4 rounded-2xl transition-all transform
                  ${isCurrentPlayer
                    ? 'bg-gray-200 border-4 border-gray-400 cursor-not-allowed'
                    : isSelected
                    ? 'bg-gradient-to-br from-green-400 to-emerald-500 border-4 border-white scale-105 shadow-2xl'
                    : 'bg-white border-4 border-purple-300 hover:scale-105 hover:shadow-xl cursor-pointer'
                  }
                `}
              >
                {isSelected && (
                  <div className="absolute -top-3 -right-3 bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold shadow-lg">
                    ✓
                  </div>
                )}

                {player.avatar ? (
                  <img
                    src={player.avatar}
                    alt={player.name}
                    className="w-20 h-20 mx-auto rounded-full object-cover border-4 border-white shadow-lg mb-2"
                  />
                ) : (
                  <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-3xl shadow-lg mb-2">
                    {player.name[0].toUpperCase()}
                  </div>
                )}

                <p className="font-cartoon text-center text-lg">
                  {player.name}
                  {isCurrentPlayer && ' (Toi)'}
                </p>
              </button>
            );
          })}
        </div>

        {/* Info en attente */}
        {hasVoted && votedCount < totalPlayers && (
          <div className="bg-white rounded-3xl shadow-2xl p-6 border-4 border-blue-300">
            <p className="text-center text-gray-700 font-cartoon text-lg mb-2">
              ⏳ En attente des autres joueurs...
            </p>
            <p className="text-center text-gray-500 font-cartoon text-sm mb-3">
              💡 Vous pouvez changer votre vote en cliquant sur un autre joueur
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {waitingFor.map(player => (
                <span key={player.id} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-cartoon">
                  {player.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Tous les votes sont là */}
        {votedCount === totalPlayers && (
          <div className="bg-gradient-to-r from-green-400 to-emerald-500 rounded-3xl shadow-2xl p-6 border-4 border-white">
            <p className="text-center text-white font-playful text-2xl">
              ✨ Tout le monde a voté ! Calcul des résultats...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
