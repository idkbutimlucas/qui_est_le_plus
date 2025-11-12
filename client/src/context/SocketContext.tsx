import { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Room, Question, QuestionResult, RoomSettings } from '../types';
import { useAudio } from './AudioContext';

interface SocketContextType {
  socket: Socket | null;
  room: Room | null;
  currentQuestion: Question | null;
  currentResult: QuestionResult | null;
  allResults: QuestionResult[] | null;
  error: string | null;
  timeRemaining: number | null;
  createRoom: (playerName: string, avatar?: string) => void;
  joinRoom: (code: string, playerName: string, avatar?: string) => void;
  updateSettings: (settings: RoomSettings) => void;
  startGame: () => void;
  vote: (targetPlayerId: string) => void;
  nextQuestion: () => void;
  backToLobby: () => void;
  leaveRoom: () => void;
  kickPlayer: (playerId: string) => void;
  transferHost: (newHostId: string) => void;
  regenerateCode: () => void;
  clearError: () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

// En production, se connecter à l'origine actuelle, sinon localhost
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ||
  (import.meta.env.MODE === 'production' ? undefined : 'http://localhost:3000');

export function SocketProvider({ children }: { children: ReactNode }) {
  const { playSound } = useAudio();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [currentResult, setCurrentResult] = useState<QuestionResult | null>(null);
  const [allResults, setAllResults] = useState<QuestionResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  // Ref pour éviter de jouer le tick plusieurs fois
  const lastTickTime = useRef<number | null>(null);

  useEffect(() => {
    const newSocket = SOCKET_URL ? io(SOCKET_URL) : io();
    setSocket(newSocket);

    // Écouter les événements
    newSocket.on('room:joined', (room: Room) => {
      setRoom(room);
      setError(null);
      playSound('join');
    });

    newSocket.on('room:updated', (room: Room) => {
      setRoom(room);
    });

    newSocket.on('room:error', (error: string) => {
      setError(error);
      playSound('error');
    });

    newSocket.on('room:kicked', () => {
      // Le joueur a été expulsé
      setRoom(null);
      setCurrentQuestion(null);
      setCurrentResult(null);
      setError('Vous avez été expulsé de la partie');
      playSound('error');
    });

    newSocket.on('game:question', (question: Question) => {
      setCurrentQuestion(question);
      setCurrentResult(null);
      setTimeRemaining(15); // Réinitialiser le timer à 15 secondes
      lastTickTime.current = null;
      playSound('whoosh');
    });

    newSocket.on('game:results', (result: QuestionResult) => {
      setCurrentResult(result);
      setTimeRemaining(null); // Arrêter le timer
      lastTickTime.current = null;
      playSound('reveal');
    });

    newSocket.on('game:finished', (results: QuestionResult[]) => {
      // Le jeu est terminé
      setAllResults(results);
      setTimeRemaining(null);
      lastTickTime.current = null;
      playSound('winner');
    });

    newSocket.on('game:timerUpdate', (time: number) => {
      setTimeRemaining(time);
      // Jouer un tick pour les 3 dernières secondes (seulement une fois par seconde)
      if (time <= 3 && time > 0 && lastTickTime.current !== time) {
        lastTickTime.current = time;
        playSound('tick');
      }
    });

    newSocket.on('game:timeExpired', () => {
      setTimeRemaining(0);
      lastTickTime.current = null;
    });

    return () => {
      newSocket.close();
    };
  }, [playSound]);

  const createRoom = (playerName: string, avatar?: string) => {
    socket?.emit('room:create', playerName, avatar);
  };

  const joinRoom = (code: string, playerName: string, avatar?: string) => {
    socket?.emit('room:join', code, playerName, avatar);
  };

  const updateSettings = (settings: RoomSettings) => {
    socket?.emit('room:updateSettings', settings);
  };

  const startGame = () => {
    socket?.emit('game:start');
  };

  const vote = (targetPlayerId: string) => {
    socket?.emit('game:vote', targetPlayerId);
  };

  const nextQuestion = () => {
    socket?.emit('game:nextQuestion');
  };

  const backToLobby = () => {
    socket?.emit('game:backToLobby');
    setCurrentQuestion(null);
    setCurrentResult(null);
    setAllResults(null);
  };

  const leaveRoom = () => {
    socket?.emit('room:leave');
    setRoom(null);
    setCurrentQuestion(null);
    setCurrentResult(null);
    setAllResults(null);
  };

  const kickPlayer = (playerId: string) => {
    socket?.emit('room:kickPlayer', playerId);
  };

  const transferHost = (newHostId: string) => {
    socket?.emit('room:transferHost', newHostId);
  };

  const regenerateCode = () => {
    socket?.emit('room:regenerateCode');
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        room,
        currentQuestion,
        currentResult,
        allResults,
        error,
        timeRemaining,
        createRoom,
        joinRoom,
        updateSettings,
        startGame,
        vote,
        nextQuestion,
        backToLobby,
        leaveRoom,
        kickPlayer,
        transferHost,
        regenerateCode,
        clearError,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
