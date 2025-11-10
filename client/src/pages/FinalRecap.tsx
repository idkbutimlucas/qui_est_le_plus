import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';

export default function FinalRecap() {
  const { room, allResults, socket, backToLobby } = useSocket();
  const navigate = useNavigate();

  const isHost = room?.players.find((p) => p.id === socket?.id)?.isHost;

  useEffect(() => {
    if (!room || !allResults) {
      navigate('/');
      return;
    }

    if (room.status !== 'finished') {
      navigate('/');
      return;
    }
  }, [room, allResults, navigate]);

  const handleBackToLobby = () => {
    backToLobby();
  };

  if (!room || !allResults) {
    return null;
  }

  return (
    <div className="neo-container h-screen flex items-center justify-center p-4">
      {/* Indicateur */}
      <div className="fixed top-4 left-4 z-20 animate-slide-in">
        <div className="neo-card px-3 py-2">
          <div className="flex items-center gap-2">
            <div className="neo-indicator animate-glow-soft"></div>
            <p className="text-xs font-semibold text-primary">
              🎉 Partie terminée
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl w-full h-full relative z-10 flex flex-col py-4">
        {/* Titre */}
        <div className="neo-card p-4 mb-4 animate-scale-in organic-shape-1 flex-shrink-0">
          <h1 className="text-2xl md:text-3xl font-bold text-center text-primary leading-tight">
            📊 Récapitulatif de la partie
          </h1>
        </div>

        {/* Liste des résultats */}
        <div className="neo-scroll-container flex-1 min-h-0 overflow-y-auto mb-4 pr-2">
          <div className="space-y-3">
            {allResults.map((result, index) => {
              // Trouver le(s) gagnant(s) - ceux avec le plus de votes
              const maxVotes = Math.max(...result.ranking.map(r => r.votes));
              const winners = result.ranking.filter(r => r.votes === maxVotes);

              return (
                <div
                  key={`result-${index}`}
                  className="neo-card p-4 animate-slide-in hover-lift"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {/* Question */}
                  <div className="mb-3">
                    <p className="text-base font-bold text-primary mb-1">
                      {result.question.text}
                    </p>
                  </div>

                  {/* Gagnant(s) */}
                  {maxVotes > 0 ? (
                    <div className="space-y-2">
                      {winners.length > 1 && (
                        <div className="text-center mb-2">
                          <p className="text-sm font-bold text-secondary">
                            ⚠️ Égalité entre {winners.length} joueurs
                          </p>
                        </div>
                      )}
                      {winners.map((winner, winnerIndex) => (
                        <div
                          key={`winner-${index}-${winnerIndex}`}
                          className="flex items-center gap-3 p-2 rounded-[20px]"
                          style={{
                            background: 'linear-gradient(145deg, rgba(201, 149, 109, 0.15), rgba(184, 136, 107, 0.15))'
                          }}
                        >
                          {/* Avatar */}
                          {winner.player.avatar ? (
                            <div className="neo-avatar w-12 h-12 animate-glow-soft">
                              <img
                                src={winner.player.avatar}
                                alt={winner.player.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="neo-avatar w-12 h-12 flex items-center justify-center animate-glow-soft">
                              <div className="bg-accent-gradient w-full h-full flex items-center justify-center text-white font-bold text-lg" style={{ borderRadius: 'inherit' }}>
                                {winner.player.name[0].toUpperCase()}
                              </div>
                            </div>
                          )}

                          {/* Nom et votes */}
                          <div className="flex-1">
                            <p className="font-bold text-lg text-accent">
                              {winner.player.name}
                            </p>
                            <p className="text-sm font-semibold text-secondary">
                              {winner.votes} vote{winner.votes > 1 ? 's' : ''}
                            </p>
                          </div>

                          {/* Médaille */}
                          <div className="text-3xl">
                            🏆
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 rounded-[20px] bg-secondary/10">
                      <p className="text-center text-secondary font-semibold text-sm">
                        Aucun vote pour cette question
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Bouton retour au lobby */}
        {isHost ? (
          <div className="neo-card p-4 animate-scale-in flex-shrink-0">
            <button
              onClick={handleBackToLobby}
              className="w-full neo-button-accent font-bold text-xl py-4 px-6 text-white"
            >
              <div className="flex items-center justify-center gap-3">
                <span className="text-2xl">🔄</span>
                <span>Retour au lobby</span>
              </div>
            </button>
          </div>
        ) : (
          <div className="neo-card p-4 animate-scale-in flex-shrink-0">
            <p className="text-center text-primary font-bold text-base flex items-center justify-center gap-2">
              <span className="text-2xl animate-pulse-soft">⏳</span>
              <span>En attente de l'hôte...</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
