import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';

export default function Results() {
  const { room, currentResult, socket } = useSocket();
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

  const handleViewVoteReveal = () => {
    navigate('/vote-reveal');
  };

  if (!room || !currentResult) {
    return null;
  }

  const isFinished = room.status === 'finished';
  const ranking = currentResult.ranking;

  // Calculer le rang de chaque joueur en tenant compte des égalités
  const getRank = (index: number) => {
    if (index === 0) return 1;
    let rank = 1;
    for (let i = 0; i < index; i++) {
      if (ranking[i].votes !== ranking[i + 1]?.votes) {
        rank = i + 2;
      }
    }
    return rank;
  };

  const getMedal = (rank: number, votes: number) => {
    if (rank === 1 && votes > 0) return '🥇';
    if (rank === 2 && votes > 0) return '🥈';
    if (rank === 3 && votes > 0) return '🥉';
    return '';
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-white">
      {/* Indicateur discret dans le coin */}
      <div className="fixed top-6 left-6 z-20">
        <div className="bg-white rounded-2xl px-4 py-2.5 border border-gray-300">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              isFinished
                ? 'bg-black'
                : 'bg-black'
            }`}></div>
            <p className="text-sm text-black font-semibold font-grotesk tracking-wide">
              {isFinished ? '🎉 Terminé' : '📊 Résultats'}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl w-full">

        {/* Question - Design épuré */}
        <div className="relative mb-6">
          <div className="glass-card rounded-2xl px-8 py-5">
            {/* Texte de la question */}
            <h2 className="text-3xl md:text-4xl font-bold text-center font-grotesk leading-snug text-black">
              {currentResult.question.text}
            </h2>
          </div>
        </div>

        {/* Classement complet - Tous les joueurs */}
        <div className="space-y-3 mb-6">
          {ranking.map((item, index) => {
            const rank = getRank(index);
            const medal = getMedal(rank, item.votes);
            const barWidth = ranking[0].votes > 0
              ? (item.votes / ranking[0].votes) * 100
              : 0;
            const isTopThree = rank <= 3 && item.votes > 0;

            return (
              <div
                key={item.player.id}
                className={`glass-card rounded-2xl overflow-hidden ${isTopThree ? 'border-2 border-black' : ''}`}
              >
                {/* Barre de fond animée */}
                <div className="relative">
                  <div
                    className="absolute top-0 left-0 h-full bg-gray-200 transition-all duration-1000 ease-out"
                    style={{ width: `${barWidth}%` }}
                  />

                  {/* Contenu */}
                  <div className="relative flex items-center justify-between p-5">
                    <div className="flex items-center gap-4">
                      {/* Position */}
                      <div className="flex flex-col items-center gap-1">
                        {medal && (
                          <div className="text-3xl">
                            {medal}
                          </div>
                        )}
                        <div className="text-2xl font-bold font-grotesk text-black">
                          #{rank}
                        </div>
                      </div>

                      {/* Avatar */}
                      {item.player.avatar ? (
                        <div className="relative">
                          <img
                            src={item.player.avatar}
                            alt={item.player.name}
                            className={`w-20 h-20 rounded-full object-cover border-2 ${
                              isTopThree ? 'border-black' : 'border-gray-300'
                            }`}
                          />
                        </div>
                      ) : (
                        <div className={`w-20 h-20 rounded-full bg-black flex items-center justify-center text-white font-bold text-3xl ${
                          isTopThree ? 'border-2 border-black' : ''
                        }`}>
                          {item.player.name[0].toUpperCase()}
                        </div>
                      )}

                      {/* Nom et votes */}
                      <div>
                        <p className="font-bold text-xl font-grotesk text-black">
                          {item.player.name}
                        </p>
                        <p className="text-sm font-semibold font-sans text-gray-600">
                          {item.votes} vote{item.votes > 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>

                    {/* Score */}
                    <div className="text-5xl font-bold font-grotesk text-black">
                      {item.votes}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Gestion égalités */}
        {ranking.filter(r => r.votes === ranking[0].votes && r.votes > 0).length > 1 && (
          <div className="glass-card rounded-2xl p-5 mb-6 border border-gray-300 bg-white">
            <p className="text-center font-semibold text-black font-sans flex items-center justify-center gap-2">
              <span className="text-2xl">⚠️</span>
              <span>Égalité ! Plusieurs personnes ont reçu le même nombre de votes</span>
            </p>
          </div>
        )}

        {/* Personne n'a voté */}
        {ranking.every(r => r.votes === 0) && (
          <div className="glass-card rounded-2xl p-5 mb-6 border border-gray-300 bg-white">
            <p className="text-center font-semibold text-black font-sans flex items-center justify-center gap-2">
              <span className="text-2xl">🤷</span>
              <span>Personne n'a reçu de votes pour cette question !</span>
            </p>
          </div>
        )}

        {/* Boutons */}
        {isHost && (
          <div className="glass-card rounded-3xl p-6">
            <button
              onClick={handleViewVoteReveal}
              className="w-full bg-black hover:bg-gray-800 text-white font-bold text-2xl py-6 px-8 rounded-2xl transition-all duration-200 font-grotesk"
            >
              <div className="flex items-center justify-center gap-3">
                <span className="text-3xl">🎭</span>
                <span>Voir qui a voté pour qui</span>
              </div>
            </button>
          </div>
        )}

        {!isHost && (
          <div className="glass-card rounded-3xl p-6">
            <p className="text-center text-black font-semibold text-xl font-grotesk flex items-center justify-center gap-3">
              <span className="text-3xl">⏳</span>
              <span>En attente que l'hôte lance la révélation...</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
