import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { Room, Question, QuestionResult } from '../types';

interface SocketContextType {
  socket: Socket | null;
  room: Room | null;
  currentQuestion: Question | null;
  currentResult: QuestionResult | null;
  error: string | null;
  createRoom: (playerName: string, avatar?: string) => void;
  joinRoom: (code: string, playerName: string, avatar?: string) => void;
  updateSettings: (settings: { numberOfQuestions: number; categories: string[] }) => void;
  startGame: () => void;
  vote: (targetPlayerId: string) => void;
  nextQuestion: () => void;
  backToLobby: () => void;
  leaveRoom: () => void;
  clearError: () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [currentResult, setCurrentResult] = useState<QuestionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    // Écouter les événements
    newSocket.on('room:joined', (room: Room) => {
      setRoom(room);
      setError(null);
    });

    newSocket.on('room:updated', (room: Room) => {
      setRoom(room);
    });

    newSocket.on('room:error', (error: string) => {
      setError(error);
    });

    newSocket.on('game:question', (question: Question) => {
      setCurrentQuestion(question);
      setCurrentResult(null);
    });

    newSocket.on('game:results', (result: QuestionResult) => {
      setCurrentResult(result);
    });

    newSocket.on('game:finished', () => {
      // Le jeu est terminé
    });

    return () => {
      newSocket.close();
    };
  }, []);

  const createRoom = (playerName: string, avatar?: string) => {
    socket?.emit('room:create', playerName, avatar);
  };

  const joinRoom = (code: string, playerName: string, avatar?: string) => {
    socket?.emit('room:join', code, playerName, avatar);
  };

  const updateSettings = (settings: { numberOfQuestions: number; categories: string[] }) => {
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
  };

  const leaveRoom = () => {
    socket?.emit('room:leave');
    setRoom(null);
    setCurrentQuestion(null);
    setCurrentResult(null);
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
        error,
        createRoom,
        joinRoom,
        updateSettings,
        startGame,
        vote,
        nextQuestion,
        backToLobby,
        leaveRoom,
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
