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

  // Préparer la liste des votes à révéler
  const [voteItems, setVoteItems] = useState<VoteRevealItem[]>([]);

  useEffect(() => {
    if (!room || !currentResult) {
      navigate('/');
      return;
    }

    // Créer la liste des votes à partir des données de la room
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

    // Mélanger les votes pour plus de suspense
    const shuffled = items.sort(() => Math.random() - 0.5);
    setVoteItems(shuffled);
  }, [room, currentResult, navigate]);

  // Countdown
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setIsCountdownDone(true);
    }
  }, [countdown]);

  // Révélation progressive des votes
  useEffect(() => {
    if (!isCountdownDone || currentRevealIndex >= voteItems.length) return;

    const timer = setTimeout(() => {
      setRevealedVotes(prev => [...prev, voteItems[currentRevealIndex]]);
      setCurrentRevealIndex(prev => prev + 1);
    }, 1500); // Révéler un vote toutes les 1.5 secondes

    return () => clearTimeout(timer);
  }, [isCountdownDone, currentRevealIndex, voteItems]);

  // Détecter la fin
  useEffect(() => {
    if (revealedVotes.length === voteItems.length && voteItems.length > 0) {
      setTimeout(() => {
        setIsComplete(true);
      }, 1500);
    }
  }, [revealedVotes, voteItems]);

  // Transition vers Results
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-white overflow-hidden">
      {/* Countdown */}
      {!isCountdownDone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-95">
          <div className="text-center">
            <div className="countdown-number text-white font-bold font-grotesk mb-4">
              {countdown}
            </div>
            <p className="text-white text-2xl font-semibold font-grotesk animate-pulse">
              Révélation des votes...
            </p>
          </div>
        </div>
      )}

      {/* Contenu principal */}
      <div className="max-w-4xl w-full">
        {/* En-tête */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-black font-grotesk mb-2">
            🎭 Qui a voté pour qui ?
          </h1>
          <p className="text-gray-600 font-medium font-sans">
            {currentResult.question.text}
          </p>
        </div>

        {/* Liste des votes révélés */}
        <div className="space-y-4">
          {revealedVotes.map((vote, index) => {
            const isMe = vote.voterId === socket?.id;
            const votedForMe = vote.votedForId === socket?.id;

            return (
              <div
                key={`${vote.voterId}-${index}`}
                className="vote-reveal-card glass-card rounded-2xl p-6 border-2 border-black"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-center justify-between gap-4">
                  {/* Votant */}
                  <div className="flex items-center gap-3 flex-1">
                    {vote.voterAvatar ? (
                      <img
                        src={vote.voterAvatar}
                        alt={vote.voterName}
                        className="w-16 h-16 rounded-full object-cover border-2 border-black"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-black flex items-center justify-center text-white font-bold text-2xl">
                        {vote.voterName[0].toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-lg font-grotesk text-black">
                        {vote.voterName}
                        {isMe && <span className="text-sm text-gray-600 ml-1">(Toi)</span>}
                      </p>
                      <p className="text-sm text-gray-600 font-sans">a voté pour</p>
                    </div>
                  </div>

                  {/* Flèche animée */}
                  <div className="arrow-animation text-4xl">
                    →
                  </div>

                  {/* Destinataire */}
                  <div className="flex items-center gap-3 flex-1 justify-end">
                    <div className="text-right">
                      <p className="font-bold text-lg font-grotesk text-black">
                        {vote.votedForName}
                        {votedForMe && <span className="text-sm text-gray-600 ml-1">(Toi!)</span>}
                      </p>
                      {votedForMe && (
                        <p className="text-sm font-semibold text-black font-sans">
                          🎉 Tu as reçu un vote !
                        </p>
                      )}
                    </div>
                    {vote.votedForAvatar ? (
                      <img
                        src={vote.votedForAvatar}
                        alt={vote.votedForName}
                        className={`w-16 h-16 rounded-full object-cover border-2 ${
                          votedForMe ? 'border-black ring-4 ring-black ring-opacity-30' : 'border-black'
                        }`}
                      />
                    ) : (
                      <div className={`w-16 h-16 rounded-full bg-black flex items-center justify-center text-white font-bold text-2xl ${
                        votedForMe ? 'ring-4 ring-black ring-opacity-30' : ''
                      }`}>
                        {vote.votedForName[0].toUpperCase()}
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
          <div className="mt-8 text-center">
            <p className="text-gray-600 font-medium font-sans mb-3">
              Révélation en cours... {revealedVotes.length} / {voteItems.length}
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden max-w-md mx-auto">
              <div
                className="h-full bg-black transition-all duration-500"
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
            <div className="glass-card rounded-2xl p-8 border-2 border-black">
              <p className="text-3xl font-bold text-black font-grotesk mb-2">
                ✨ Tous les votes ont été révélés ! ✨
              </p>
              <p className="text-gray-600 font-medium font-sans">
                Direction les résultats...
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
