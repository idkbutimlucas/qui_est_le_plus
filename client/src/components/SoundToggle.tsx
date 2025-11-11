import { useAudio } from '../context/AudioContext';

export default function SoundToggle() {
  const { isMuted, toggleMute, playSound } = useAudio();

  const handleToggle = () => {
    toggleMute();
    // Jouer un son de confirmation si on unmute
    if (isMuted) {
      setTimeout(() => playSound('click'), 50);
    }
  };

  return (
    <button
      onClick={handleToggle}
      className="fixed bottom-4 right-4 z-50 p-2.5 rounded-xl bg-white border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-150 opacity-80 hover:opacity-100"
      aria-label={isMuted ? "Activer le son" : "Désactiver le son"}
      title={isMuted ? "Activer le son" : "Désactiver le son"}
    >
      {isMuted ? (
        // Icône son coupé
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M11 5L6 9H2v6h4l5 4V5z" />
          <line x1="23" y1="9" x2="17" y2="15" />
          <line x1="17" y1="9" x2="23" y2="15" />
        </svg>
      ) : (
        // Icône son activé
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M11 5L6 9H2v6h4l5 4V5z" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
        </svg>
      )}
    </button>
  );
}
