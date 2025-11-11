import { useCallback } from 'react';
import confetti from 'canvas-confetti';

export function useConfetti() {
  // Confettis pour le gagnant d'une question
  const celebrateWinner = useCallback(() => {
    const count = 150;
    const defaults = {
      origin: { y: 0.7 },
      colors: ['#D4A574', '#F4E4D7', '#8B7355', '#E8D4B8', '#C9A882'],
    };

    function fire(particleRatio: number, opts: confetti.Options) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    }

    fire(0.25, {
      spread: 26,
      startVelocity: 55,
    });

    fire(0.2, {
      spread: 60,
    });

    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8,
    });

    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2,
    });

    fire(0.1, {
      spread: 120,
      startVelocity: 45,
    });
  }, []);

  // Grosse explosion pour le grand gagnant final
  const celebrateChampion = useCallback(() => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = {
      startVelocity: 30,
      spread: 360,
      ticks: 60,
      zIndex: 0,
      colors: ['#D4A574', '#F4E4D7', '#8B7355', '#E8D4B8', '#C9A882'],
    };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      // Confettis depuis la gauche
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });

      // Confettis depuis la droite
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);
  }, []);

  // Pluie de confettis douce
  const gentleRain = useCallback(() => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#D4A574', '#F4E4D7', '#8B7355', '#E8D4B8', '#C9A882'],
    });
  }, []);

  // Canon de confettis latéral
  const sideCannon = useCallback((side: 'left' | 'right' = 'left') => {
    const angle = side === 'left' ? 60 : 120;
    const originX = side === 'left' ? 0 : 1;

    confetti({
      particleCount: 100,
      angle,
      spread: 55,
      origin: { x: originX, y: 0.6 },
      colors: ['#D4A574', '#F4E4D7', '#8B7355', '#E8D4B8', '#C9A882'],
    });
  }, []);

  return {
    celebrateWinner,
    celebrateChampion,
    gentleRain,
    sideCannon,
  };
}
