import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';

export default function Results() {
  const { room, currentResult, socket, nextQuestion, backToLobby } = useSocket();
  const navigate = useNavigate();

  const isHost = room?.players.find((p) => p.id === socket?.id)?.isHost;

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
  }, [room, navigate]);

  const handleNextQuestion = () => {
    nextQuestion();
  };

  const handleBackToLobby = () => {
    backToLobby();
  };

  if (!room || !currentResult) {
    return null;
  }

  const isFinished = room.status === 'finished';
  const ranking = currentResult.ranking;

  // Déterminer les médailles
  const getMedal = (index: number) => {
    if (index === 0 && ranking[0].votes > 0) return '🥇';
    if (index === 1 && ranking[1].votes > 0) return '🥈';
    if (index === 2 && ranking[2]?.votes > 0) return '🥉';
    return '';
  };

  const getColor = (index: number) => {
    if (index === 0 && ranking[0].votes > 0) return 'from-yellow-400 to-orange-400';
    if (index === 1 && ranking[1].votes > 0) return 'from-gray-300 to-gray-400';
    if (index === 2 && ranking[2]?.votes > 0) return 'from-orange-300 to-orange-400';
    return 'from-purple-200 to-pink-200';
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* En-tête */}
        <div className="bg-white rounded-3xl shadow-2xl p-6 mb-4 border-4 border-purple-300">
          <h1 className="text-4xl font-playful text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
            {isFinished ? '🎉 Partie terminée !' : '📊 Résultats'}
          </h1>
        </div>

        {/* Question */}
        <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 rounded-3xl shadow-2xl p-6 mb-6 border-4 border-white">
          <h2 className="text-3xl font-playful text-center text-white drop-shadow-lg">
            {currentResult.question.text}
          </h2>
        </div>

        {/* Classement */}
        <div className="space-y-3 mb-6">
          {ranking.map((item, index) => {
            const medal = getMedal(index);
            const colorGradient = getColor(index);
            const barWidth = ranking[0].votes > 0
              ? (item.votes / ranking[0].votes) * 100
              : 0;

            return (
              <div
                key={item.player.id}
                className={`
                  relative overflow-hidden bg-white rounded-2xl shadow-lg border-4 transition-all
                  ${index === 0 && item.votes > 0 ? 'border-yellow-400 scale-105' : 'border-purple-200'}
                `}
              >
                {/* Barre de fond animée */}
                <div
                  className={`absolute top-0 left-0 h-full bg-gradient-to-r ${colorGradient} transition-all duration-1000 ease-out`}
                  style={{ width: `${barWidth}%` }}
                />

                {/* Contenu */}
                <div className="relative flex items-center justify-between p-4">
                  <div className="flex items-center space-x-4">
                    <div className="text-3xl font-bold text-gray-400 w-8">
                      #{index + 1}
                    </div>

                    {item.player.avatar ? (
                      <img
                        src={item.player.avatar}
                        alt={item.player.name}
                        className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-lg"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                        {item.player.name[0].toUpperCase()}
                      </div>
                    )}

                    <div>
                      <p className="font-cartoon text-xl font-bold">
                        {medal} {item.player.name}
                      </p>
                      <p className="text-sm text-gray-600 font-cartoon">
                        {item.votes} vote{item.votes > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>

                  <div className="text-4xl font-bold text-gray-700">
                    {item.votes}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Gestion égalités */}
        {ranking.filter(r => r.votes === ranking[0].votes && r.votes > 0).length > 1 && (
          <div className="bg-yellow-100 border-4 border-yellow-400 rounded-2xl p-4 mb-6">
            <p className="text-center font-cartoon text-yellow-800">
              ⚠️ Égalité ! Plusieurs personnes ont reçu le même nombre de votes
            </p>
          </div>
        )}

        {/* Personne n'a voté */}
        {ranking.every(r => r.votes === 0) && (
          <div className="bg-gray-100 border-4 border-gray-400 rounded-2xl p-4 mb-6">
            <p className="text-center font-cartoon text-gray-800">
              🤷 Personne n'a reçu de votes pour cette question !
            </p>
          </div>
        )}

        {/* Boutons */}
        {isHost && (
          <div className="bg-white rounded-3xl shadow-2xl p-6 border-4 border-green-300">
            {isFinished ? (
              <button
                onClick={handleBackToLobby}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-cartoon text-2xl py-4 px-6 rounded-2xl hover:scale-105 transform transition shadow-lg hover:shadow-xl"
              >
                🔄 Retour au lobby
              </button>
            ) : (
              <button
                onClick={handleNextQuestion}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white font-cartoon text-2xl py-4 px-6 rounded-2xl hover:scale-105 transform transition shadow-lg hover:shadow-xl"
              >
                ➡️ Question suivante
              </button>
            )}
          </div>
        )}

        {!isHost && (
          <div className="bg-white rounded-3xl shadow-2xl p-6 border-4 border-blue-300">
            <p className="text-center text-gray-600 font-cartoon text-lg">
              {isFinished
                ? "🎉 Merci d'avoir joué !"
                : "⏳ En attente que l'hôte lance la prochaine question..."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
