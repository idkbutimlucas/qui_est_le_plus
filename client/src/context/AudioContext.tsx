import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { soundGenerator, SoundType } from '../utils/soundGenerator';

interface AudioContextType {
  isMuted: boolean;
  volume: number;
  toggleMute: () => void;
  setVolume: (volume: number) => void;
  playSound: (type: SoundType) => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

const STORAGE_KEY = 'gameAudioPreferences';

interface AudioPreferences {
  isMuted: boolean;
  volume: number;
}

export function AudioProvider({ children }: { children: ReactNode }) {
  const [isMuted, setIsMuted] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const prefs: AudioPreferences = JSON.parse(stored);
        return prefs.isMuted ?? false;
      }
    } catch (error) {
      console.warn('Failed to load audio preferences:', error);
    }
    return false;
  });

  const [volume, setVolumeState] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const prefs: AudioPreferences = JSON.parse(stored);
        return prefs.volume ?? 0.5;
      }
    } catch (error) {
      console.warn('Failed to load audio preferences:', error);
    }
    return 0.5;
  });

  // Utiliser une ref pour isMuted afin que playSound ne change pas de référence
  const isMutedRef = useRef(isMuted);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  // Sauvegarder les préférences dans localStorage
  useEffect(() => {
    try {
      const prefs: AudioPreferences = { isMuted, volume };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch (error) {
      console.warn('Failed to save audio preferences:', error);
    }
  }, [isMuted, volume]);

  // Appliquer le volume au générateur de sons
  useEffect(() => {
    soundGenerator.setVolume(isMuted ? 0 : volume);
  }, [isMuted, volume]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  const setVolume = useCallback((newVolume: number) => {
    setVolumeState(Math.max(0, Math.min(1, newVolume)));
  }, []);

  // Mémoriser playSound pour éviter les re-renders inutiles du SocketContext
  const playSound = useCallback((type: SoundType) => {
    if (!isMutedRef.current) {
      soundGenerator.play(type);
    }
  }, []); // Pas de dépendances car on utilise la ref

  return (
    <AudioContext.Provider value={{ isMuted, volume, toggleMute, setVolume, playSound }}>
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
}
