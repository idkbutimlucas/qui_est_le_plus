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

    // Toujours rediriger vers le lobby si le statut est 'lobby'
    if (room.status === 'lobby') {
      navigate('/lobby');
      return;
    }

    // Ne rediriger vers le jeu que si on n'a pas de résultats à afficher
    if (!currentResult && room.status === 'playing') {
      navigate('/game');
      return;
    }
  }, [room, currentResult, navigate]);

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
    <div className="neo-container h-screen flex items-center justify-center p-4">
      {/* Indicateur de progression des questions */}
      <div className="fixed top-4 left-4 z-20 animate-slide-in">
        <div className="neo-card px-3 py-2">
          <div className="flex items-center gap-2">
            <div className={`neo-indicator ${isFinished ? 'animate-glow-soft' : ''}`}></div>
            <p className="text-xs font-semibold text-primary">
              Q {room.currentQuestionIndex + 1}/{room.settings.numberOfQuestions}
              {isFinished && ' 🎉'}
            </p>
          </div>
          <div className="neo-progress-bar h-1 mt-1">
            <div
              className="neo-progress-fill"
              style={{
                width: `${((room.currentQuestionIndex + 1) / room.settings.numberOfQuestions) * 100}%`,
              }}
            ></div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl w-full h-full relative z-10 flex flex-col py-4">
        {/* Question */}
        <div className="neo-card p-3 mb-3 animate-scale-in flex-shrink-0">
          <h2 className="text-xl md:text-2xl font-bold text-center text-primary leading-tight">
            {currentResult.question.text}
          </h2>
        </div>

        {/* Classement complet */}
        <div className="neo-scroll-container flex-1 min-h-0 overflow-y-auto mb-3 pr-2">
            <div className="space-y-2">
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
                className={`neo-card hover-lift animate-slide-in ${isTopThree ? 'animate-glow-soft' : ''}`}
                style={{
                  animationDelay: `${index * 0.1}s`,
                  overflow: 'visible',
                  margin: isTopThree ? '8px 0' : '0'
                }}
              >
                <div className="relative overflow-hidden rounded-[30px]">
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
                  <div className="relative flex items-center justify-between p-3">
                    <div className="flex items-center gap-3">
                      {/* Position */}
                      <div className="flex flex-col items-center gap-1">
                        {medal && (
                          <div className="text-xl animate-pulse-soft">
                            {medal}
                          </div>
                        )}
                        <div className={`text-base font-bold px-3 py-1 rounded-full ${isTopThree ? 'neo-badge' : 'neo-pressed text-primary'}`}>
                          #{rank}
                        </div>
                      </div>

                      {/* Avatar */}
                      {item.player.avatar ? (
                        <div className="neo-avatar w-12 h-12">
                          <img
                            src={item.player.avatar}
                            alt={item.player.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="neo-avatar w-12 h-12 flex items-center justify-center">
                          <div className={`w-full h-full flex items-center justify-center font-bold text-lg ${isTopThree ? 'bg-accent-gradient text-white' : 'bg-accent-gradient text-white'}`} style={{ borderRadius: 'inherit' }}>
                            {item.player.name[0].toUpperCase()}
                          </div>
                        </div>
                      )}

                      {/* Nom et votes */}
                      <div>
                        <p className="font-bold text-base text-primary">
                          {item.player.name}
                        </p>
                        <p className="text-xs font-semibold text-secondary">
                          {item.votes} vote{item.votes > 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>

                    {/* Score */}
                    <div className={`text-3xl font-bold px-2 ${isTopThree ? 'text-accent' : 'text-primary'}`}>
                      {item.votes}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
            </div>
        </div>

        {/* Gestion égalités */}
        {ranking.filter(r => r.votes === ranking[0].votes && r.votes > 0).length > 1 && (
          <div className="neo-card p-3 mb-3 animate-slide-in flex-shrink-0">
            <p className="text-center font-bold text-base text-primary flex items-center justify-center gap-2">
              <span className="text-base">⚠️</span>
              <span>Égalité !</span>
            </p>
          </div>
        )}

        {/* Personne n'a voté */}
        {ranking.every(r => r.votes === 0) && (
          <div className="neo-card p-3 mb-3 animate-slide-in flex-shrink-0">
            <p className="text-center font-bold text-base text-primary flex items-center justify-center gap-2">
              <span className="text-base">🤷</span>
              <span>Aucun vote !</span>
            </p>
          </div>
        )}

        {/* Boutons */}
        {isHost && (
          <div className="neo-card p-4 animate-scale-in flex-shrink-0">
            {isFinished ? (
              <button
                onClick={handleBackToLobby}
                className="w-full neo-button-accent font-bold text-xl py-4 px-6 text-white"
              >
                <div className="flex items-center justify-center gap-3">
                  <span className="text-2xl">🔄</span>
                  <span>Retour au lobby</span>
                </div>
              </button>
            ) : (
              <button
                onClick={handleNextQuestion}
                className="w-full neo-button-accent font-bold text-xl py-4 px-6 text-white"
              >
                <div className="flex items-center justify-center gap-3">
                  <span className="text-2xl">➡️</span>
                  <span>Question suivante</span>
                </div>
              </button>
            )}
          </div>
        )}

        {!isHost && (
          <div className="neo-card p-4 animate-scale-in flex-shrink-0">
            <p className="text-center text-primary font-bold text-base flex items-center justify-center gap-2">
              {isFinished ? (
                <>
                  <span className="text-2xl">🎉</span>
                  <span>Merci !</span>
                </>
              ) : (
                <>
                  <span className="text-2xl animate-pulse-soft">⏳</span>
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
