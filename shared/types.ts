// Types partagés entre le client et le serveur

export type QuestionCategory = 'soft' | 'classique' | 'humour-noir' | 'hard' | 'politiquement-incorrect' | 'custom';

export interface Player {
  id: string;
  name: string;
  avatar?: string; // URL ou base64 de l'image
  isHost: boolean;
}

export interface RoomSettings {
  numberOfQuestions: number;
  categories: QuestionCategory[];
}

export interface Room {
  id: string;
  code: string;
  hostId: string;
  players: Player[];
  settings: RoomSettings;
  currentQuestionIndex: number;
  currentQuestion?: Question;
  votes: Record<string, string>; // playerId -> votedForPlayerId
  results: QuestionResult[];
  status: 'lobby' | 'custom-questions' | 'playing' | 'results' | 'finished';
  customQuestions?: string[]; // Adjectifs personnalisés saisis par les joueurs
}

export interface Question {
  id: string;
  text: string; // ex: "Qui est le plus... drôle ?"
  adjective: string; // ex: "drôle"
  category: QuestionCategory;
}

export interface QuestionResult {
  question: Question;
  votes: Record<string, number>; // playerId -> nombre de votes reçus
  ranking: Array<{ player: Player; votes: number }>;
}

// Events Socket.io
export interface ServerToClientEvents {
  'room:updated': (room: Room) => void;
  'room:joined': (room: Room) => void;
  'room:error': (error: string) => void;
  'room:kicked': () => void;
  'game:question': (question: Question) => void;
  'game:results': (result: QuestionResult) => void;
  'game:finished': (allResults: QuestionResult[]) => void;
  'custom:questionsUpdated': (questions: string[]) => void;
}

export interface ClientToServerEvents {
  'room:create': (playerName: string, avatar?: string) => void;
  'room:join': (code: string, playerName: string, avatar?: string) => void;
  'room:updateSettings': (settings: RoomSettings) => void;
  'room:leave': () => void;
  'room:kickPlayer': (playerId: string) => void;
  'room:regenerateCode': () => void;
  'game:start': () => void;
  'game:vote': (targetPlayerId: string) => void;
  'game:nextQuestion': () => void;
  'game:backToLobby': () => void;
  'custom:addQuestion': (adjective: string) => void;
  'custom:removeQuestion': (index: number) => void;
  'custom:startGame': () => void;
}
