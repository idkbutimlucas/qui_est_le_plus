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
    <div className="neo-container min-h-screen flex items-center justify-center p-4 overflow-hidden">
      {/* Countdown */}
      {!isCountdownDone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
          <div className="text-center animate-scale-in">
            <div className="neo-card p-12 mb-6 organic-shape-1">
              <div className="neo-countdown animate-pulse-soft">
                {countdown}
              </div>
            </div>
            <p className="text-primary text-3xl font-bold">
              Révélation des votes...
            </p>
          </div>
        </div>
      )}

      {/* Contenu principal */}
      <div className="max-w-4xl w-full">
        {/* En-tête */}
        <div className="text-center mb-8 animate-scale-in">
          <div className="neo-card p-6 inline-block organic-shape-1 mb-4">
            <h1 className="text-4xl font-bold text-primary">
              🎭 Les votes
            </h1>
          </div>
          <p className="text-primary font-bold text-lg">
            {currentResult.question.text}
          </p>
        </div>

        {/* Liste des votes révélés */}
        <div className="space-y-5">
          {revealedVotes.map((vote, index) => {
            const isMe = vote.voterId === socket?.id;
            const votedForMe = vote.votedForId === socket?.id;

            return (
              <div
                key={`${vote.voterId}-${index}`}
                className="neo-card p-6 vote-card-enter hover-lift"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-center justify-between gap-4">
                  {/* Votant */}
                  <div className="flex items-center gap-3 flex-1">
                    {vote.voterAvatar ? (
                      <div className="neo-avatar w-16 h-16">
                        <img
                          src={vote.voterAvatar}
                          alt={vote.voterName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="neo-avatar w-16 h-16 flex items-center justify-center">
                        <div className="bg-accent-gradient w-full h-full flex items-center justify-center text-white font-bold text-2xl" style={{ borderRadius: 'inherit' }}>
                          {vote.voterName[0].toUpperCase()}
                        </div>
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-lg text-primary">
                        {vote.voterName}
                        {isMe && <span className="text-xs text-secondary ml-1">(Toi)</span>}
                      </p>
                      <p className="text-sm text-secondary font-semibold">→ A voté pour</p>
                    </div>
                  </div>

                  {/* Flèche */}
                  <div className="text-4xl text-accent font-bold">
                    →
                  </div>

                  {/* Destinataire */}
                  <div className="flex items-center gap-3 flex-1 justify-end">
                    <div className="text-right">
                      <p className="font-bold text-lg text-primary">
                        {vote.votedForName}
                        {votedForMe && <span className="text-xs text-secondary ml-1">(Toi!)</span>}
                      </p>
                      {votedForMe && (
                        <p className="text-sm font-bold text-accent">
                          🎉 +1 vote
                        </p>
                      )}
                    </div>
                    {vote.votedForAvatar ? (
                      <div className={`neo-avatar w-16 h-16 ${votedForMe ? 'animate-glow-soft' : ''}`}>
                        <img
                          src={vote.votedForAvatar}
                          alt={vote.votedForName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className={`neo-avatar w-16 h-16 flex items-center justify-center ${votedForMe ? 'animate-glow-soft' : ''}`}>
                        <div className={`w-full h-full flex items-center justify-center font-bold text-2xl ${votedForMe ? 'bg-accent-gradient text-white' : 'bg-accent-gradient text-white'}`} style={{ borderRadius: 'inherit' }}>
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

        {/* Indicateur de progression */}
        {isCountdownDone && !isComplete && (
          <div className="mt-8 text-center animate-slide-in">
            <p className="text-primary font-bold mb-4 text-lg">
              {revealedVotes.length} / {voteItems.length}
            </p>
            <div className="neo-progress-bar h-4 max-w-md mx-auto">
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
          <div className="mt-8 text-center animate-scale-in">
            <div className="neo-card p-8">
              <p className="text-3xl font-bold text-primary mb-3">
                ✨ Terminé ! ✨
              </p>
              <p className="text-secondary font-semibold">
                → Résultats
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
