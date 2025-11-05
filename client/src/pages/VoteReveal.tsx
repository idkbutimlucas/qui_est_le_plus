import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';

interface VoteRevealItem {
  voterId: string;
  voterName: string;
  voterAvatar?: string;
  votedForId: string;
  votedForName: string;
  votedForAvatar?: string;
}

export default function VoteReveal() {
  const { room, currentResult, socket } = useSocket();
  const navigate = useNavigate();

  const [countdown, setCountdown] = useState(3);
  const [isCountdownDone, setIsCountdownDone] = useState(false);
  const [revealedVotes, setRevealedVotes] = useState<VoteRevealItem[]>([]);
  const [currentRevealIndex, setCurrentRevealIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const [voteItems, setVoteItems] = useState<VoteRevealItem[]>([]);

  useEffect(() => {
    if (!room || !currentResult) {
      navigate('/');
      return;
    }

    const items: VoteRevealItem[] = [];
    Object.entries(room.votes).forEach(([voterId, votedForId]) => {
      const voter = room.players.find(p => p.id === voterId);
      const votedFor = room.players.find(p => p.id === votedForId);

      if (voter && votedFor) {
        items.push({
          voterId,
          voterName: voter.name,
          voterAvatar: voter.avatar,
          votedForId,
          votedForName: votedFor.name,
          votedForAvatar: votedFor.avatar,
        });
      }
    });

    const shuffled = items.sort(() => Math.random() - 0.5);
    setVoteItems(shuffled);
  }, [room, currentResult, navigate]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setIsCountdownDone(true);
    }
  }, [countdown]);

  useEffect(() => {
    if (!isCountdownDone || currentRevealIndex >= voteItems.length) return;

    const timer = setTimeout(() => {
      setRevealedVotes(prev => [...prev, voteItems[currentRevealIndex]]);
      setCurrentRevealIndex(prev => prev + 1);
    }, 1500);

    return () => clearTimeout(timer);
  }, [isCountdownDone, currentRevealIndex, voteItems]);

  useEffect(() => {
    if (revealedVotes.length === voteItems.length && voteItems.length > 0) {
      setTimeout(() => {
        setIsComplete(true);
      }, 1500);
    }
  }, [revealedVotes, voteItems]);

  useEffect(() => {
    if (isComplete) {
      setTimeout(() => {
        navigate('/results');
      }, 3000);
    }
  }, [isComplete, navigate]);

  if (!room || !currentResult) {
    return null;
  }

  return (
    <div className="neo-container h-screen flex items-center justify-center p-4 overflow-hidden">
      {/* Countdown */}
      {!isCountdownDone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
          <div className="text-center animate-scale-in">
            <div className="neo-card p-8 mb-4 organic-shape-1">
              <div className="neo-countdown animate-pulse-soft">
                {countdown}
              </div>
            </div>
            <p className="text-primary text-2xl font-bold">
              Révélation des votes...
            </p>
          </div>
        </div>
      )}

      {/* Contenu principal */}
      <div className="max-w-4xl w-full h-full flex flex-col py-4">
        {/* En-tête */}
        <div className="text-center mb-3 animate-scale-in flex-shrink-0">
          <div className="neo-card p-3 inline-block organic-shape-1 mb-2">
            <h1 className="text-2xl font-bold text-primary">
              🎭 Les votes
            </h1>
          </div>
          <p className="text-primary font-bold text-sm">
            {currentResult.question.text}
          </p>
        </div>

        {/* Liste des votes révélés */}
        <div className="neo-scroll-container flex-1 min-h-0 overflow-y-auto mb-3 pr-2">
          <div className="space-y-3">
          {revealedVotes.map((vote, index) => {
            const isMe = vote.voterId === socket?.id;
            const votedForMe = vote.votedForId === socket?.id;

            return (
              <div
                key={`${vote.voterId}-${index}`}
                className="neo-card p-3 vote-card-enter hover-lift"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-center justify-between gap-3">
                  {/* Votant */}
                  <div className="flex items-center gap-2 flex-1">
                    {vote.voterAvatar ? (
                      <div className="neo-avatar w-12 h-12">
                        <img
                          src={vote.voterAvatar}
                          alt={vote.voterName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="neo-avatar w-12 h-12 flex items-center justify-center">
                        <div className="bg-accent-gradient w-full h-full flex items-center justify-center text-white font-bold text-base" style={{ borderRadius: 'inherit' }}>
                          {vote.voterName[0].toUpperCase()}
                        </div>
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-sm text-primary">
                        {vote.voterName}
                        {isMe && <span className="text-xs text-secondary ml-1">(Toi)</span>}
                      </p>
                      <p className="text-xs text-secondary font-semibold">→ A voté pour</p>
                    </div>
                  </div>

                  {/* Flèche */}
                  <div className="text-2xl text-accent font-bold">
                    →
                  </div>

                  {/* Destinataire */}
                  <div className="flex items-center gap-2 flex-1 justify-end">
                    <div className="text-right">
                      <p className="font-bold text-sm text-primary">
                        {vote.votedForName}
                        {votedForMe && <span className="text-xs text-secondary ml-1">(Toi!)</span>}
                      </p>
                      {votedForMe && (
                        <p className="text-xs font-bold text-accent">
                          🎉 +1 vote
                        </p>
                      )}
                    </div>
                    {vote.votedForAvatar ? (
                      <div className={`neo-avatar w-12 h-12 ${votedForMe ? 'animate-glow-soft' : ''}`}>
                        <img
                          src={vote.votedForAvatar}
                          alt={vote.votedForName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className={`neo-avatar w-12 h-12 flex items-center justify-center ${votedForMe ? 'animate-glow-soft' : ''}`}>
                        <div className={`w-full h-full flex items-center justify-center font-bold text-base ${votedForMe ? 'bg-accent-gradient text-white' : 'bg-accent-gradient text-white'}`} style={{ borderRadius: 'inherit' }}>
                          {vote.votedForName[0].toUpperCase()}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          </div>
        </div>

        {/* Indicateur de progression */}
        {isCountdownDone && !isComplete && (
          <div className="text-center animate-slide-in flex-shrink-0 mb-3">
            <p className="text-primary font-bold mb-2 text-sm">
              {revealedVotes.length} / {voteItems.length}
            </p>
            <div className="neo-progress-bar h-2 max-w-md mx-auto">
              <div
                className="neo-progress-fill"
                style={{
                  width: `${(revealedVotes.length / voteItems.length) * 100}%`,
                }}
              ></div>
            </div>
          </div>
        )}

        {/* Message de fin */}
        {isComplete && (
          <div className="text-center animate-scale-in flex-shrink-0">
            <div className="neo-card p-4">
              <p className="text-2xl font-bold text-primary mb-2">
                ✨ Terminé ! ✨
              </p>
              <p className="text-secondary font-semibold text-sm">
                → Résultats
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
