// Types partagés entre le client et le serveur

// Catégories de questions
export type QuestionCategory =
  | 'soft'
  | 'classique'
  | 'humour-noir'
  | 'hard'
  | 'politiquement-incorrect'
  | 'custom';

// Labels des catégories
export const categoryLabels: Record<QuestionCategory, string> = {
  'soft': 'Doux',
  'classique': 'Classique',
  'humour-noir': 'Humour Noir',
  'hard': 'Hard',
  'politiquement-incorrect': 'Politiquement Incorrect',
  'custom': 'Personnalisé'
};

// Interface pour un joueur
export interface Player {
  id: string;
  name: string;
  avatar?: string;
  isHost: boolean;
}

// Interface pour les settings de la room
export interface RoomSettings {
  numberOfQuestions: number;
  categories: QuestionCategory[];
}

// Interface pour une question
export interface Question {
  id: string;
  text: string;
  adjective: string;
  category: QuestionCategory;
}

// Interface pour le résultat d'une question
export interface QuestionResult {
  question: Question;
  votes: Record<string, number>;
  ranking: Array<{
    player: Player;
    votes: number;
  }>;
}

// Interface pour une room
export interface Room {
  id: string;
  code: string;
  hostId: string;
  players: Player[];
  settings: RoomSettings;
  currentQuestionIndex: number;
  currentQuestion?: Question;
  votes: Record<string, string>;
  results: QuestionResult[];
  status: 'lobby' | 'custom-questions' | 'playing' | 'results' | 'finished';
  customQuestions?: string[];
}
