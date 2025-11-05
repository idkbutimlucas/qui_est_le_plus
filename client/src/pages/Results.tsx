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
    <div className="neo-container min-h-screen flex items-center justify-center p-4">
      {/* Indicateur */}
      <div className="fixed top-6 left-6 z-20 animate-slide-in">
        <div className="neo-card px-4 py-3">
          <div className="flex items-center gap-2">
            <div className={`neo-indicator ${isFinished ? 'animate-glow-soft' : ''}`}></div>
            <p className="text-sm font-semibold text-primary">
              {isFinished ? '🎉 Terminé' : '📊 Résultats'}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl w-full relative z-10">
        {/* Question */}
        <div className="neo-card p-6 mb-8 animate-scale-in">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-primary leading-tight">
            {currentResult.question.text}
          </h2>
        </div>

        {/* Classement complet */}
        <div className="space-y-4 mb-8">
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
                className={`neo-card overflow-hidden hover-lift animate-slide-in ${isTopThree ? 'animate-glow-soft' : ''}`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="relative">
                  {/* Barre de fond */}
                  <div
                    className="absolute top-0 left-0 h-full transition-all duration-1000 ease-out"
                    style={{
                      width: `${barWidth}%`,
                      background: isTopThree
                        ? 'linear-gradient(145deg, rgba(201, 149, 109, 0.15), rgba(184, 136, 107, 0.15))'
                        : 'rgba(93, 78, 63, 0.05)'
                    }}
                  />

                  {/* Contenu */}
                  <div className="relative flex items-center justify-between p-5">
                    <div className="flex items-center gap-4">
                      {/* Position */}
                      <div className="flex flex-col items-center gap-1">
                        {medal && (
                          <div className="text-3xl animate-pulse-soft">
                            {medal}
                          </div>
                        )}
                        <div className={`text-2xl font-bold px-4 py-2 rounded-full ${isTopThree ? 'neo-badge' : 'neo-pressed text-primary'}`}>
                          #{rank}
                        </div>
                      </div>

                      {/* Avatar */}
                      {item.player.avatar ? (
                        <div className="neo-avatar w-20 h-20">
                          <img
                            src={item.player.avatar}
                            alt={item.player.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="neo-avatar w-20 h-20 flex items-center justify-center">
                          <div className={`w-full h-full flex items-center justify-center font-bold text-3xl ${isTopThree ? 'bg-accent-gradient text-white' : 'bg-accent-gradient text-white'}`} style={{ borderRadius: 'inherit' }}>
                            {item.player.name[0].toUpperCase()}
                          </div>
                        </div>
                      )}

                      {/* Nom et votes */}
                      <div>
                        <p className="font-bold text-xl text-primary">
                          {item.player.name}
                        </p>
                        <p className="text-sm font-semibold text-secondary">
                          {item.votes} vote{item.votes > 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>

                    {/* Score */}
                    <div className={`text-5xl font-bold px-4 py-2 ${isTopThree ? 'text-accent' : 'text-primary'}`}>
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
          <div className="neo-card p-5 mb-8 animate-slide-in">
            <p className="text-center font-bold text-primary flex items-center justify-center gap-2">
              <span className="text-2xl">⚠️</span>
              <span>Égalité !</span>
            </p>
          </div>
        )}

        {/* Personne n'a voté */}
        {ranking.every(r => r.votes === 0) && (
          <div className="neo-card p-5 mb-8 animate-slide-in">
            <p className="text-center font-bold text-primary flex items-center justify-center gap-2">
              <span className="text-2xl">🤷</span>
              <span>Aucun vote !</span>
            </p>
          </div>
        )}

        {/* Boutons */}
        {isHost && (
          <div className="neo-card p-6 animate-scale-in">
            {isFinished ? (
              <button
                onClick={handleBackToLobby}
                className="w-full neo-button-accent font-bold text-2xl py-6 px-8 text-white"
              >
                <div className="flex items-center justify-center gap-3">
                  <span className="text-3xl">🔄</span>
                  <span>Retour au lobby</span>
                </div>
              </button>
            ) : (
              <button
                onClick={handleNextQuestion}
                className="w-full neo-button-accent font-bold text-2xl py-6 px-8 text-white"
              >
                <div className="flex items-center justify-center gap-3">
                  <span className="text-3xl">➡️</span>
                  <span>Question suivante</span>
                </div>
              </button>
            )}
          </div>
        )}

        {!isHost && (
          <div className="neo-card p-6 animate-scale-in">
            <p className="text-center text-primary font-bold text-xl flex items-center justify-center gap-3">
              {isFinished ? (
                <>
                  <span className="text-3xl">🎉</span>
                  <span>Merci !</span>
                </>
              ) : (
                <>
                  <span className="text-3xl animate-pulse-soft">⏳</span>
                  <span>En attente...</span>
                </>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
