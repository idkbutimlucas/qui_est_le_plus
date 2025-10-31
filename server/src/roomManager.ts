import { nanoid } from 'nanoid';
import { Room, Player, RoomSettings, Question, QuestionResult } from '../../shared/types.js';
import { getRandomQuestions } from './data/questions.js';

export class RoomManager {
  private rooms: Map<string, Room> = new Map();
  private playerRooms: Map<string, string> = new Map(); // playerId -> roomCode

  // Générer un code de room unique (4 caractères)
  private generateRoomCode(): string {
    let code: string;
    do {
      code = nanoid(6).toUpperCase();
    } while (this.rooms.has(code));
    return code;
  }

  // Créer une nouvelle room
  createRoom(hostSocketId: string, playerName: string, avatar?: string): Room {
    const code = this.generateRoomCode();
    const host: Player = {
      id: hostSocketId,
      name: playerName,
      avatar,
      isHost: true
    };

    const room: Room = {
      id: nanoid(),
      code,
      hostId: hostSocketId,
      players: [host],
      settings: {
        numberOfQuestions: 10,
        categories: ['classique']
      },
      currentQuestionIndex: 0,
      votes: {},
      results: [],
      status: 'lobby'
    };

    this.rooms.set(code, room);
    this.playerRooms.set(hostSocketId, code);
    return room;
  }

  // Rejoindre une room
  joinRoom(code: string, playerId: string, playerName: string, avatar?: string): Room | null {
    const room = this.rooms.get(code.toUpperCase());
    if (!room) return null;

    // Vérifier si le joueur existe déjà
    const existingPlayer = room.players.find(p => p.id === playerId);
    if (existingPlayer) return room;

    // Ajouter le nouveau joueur
    const player: Player = {
      id: playerId,
      name: playerName,
      avatar,
      isHost: false
    };

    room.players.push(player);
    this.playerRooms.set(playerId, code.toUpperCase());
    return room;
  }

  // Quitter une room
  leaveRoom(playerId: string): { room: Room | null; shouldDelete: boolean } {
    const roomCode = this.playerRooms.get(playerId);
    if (!roomCode) return { room: null, shouldDelete: false };

    const room = this.rooms.get(roomCode);
    if (!room) return { room: null, shouldDelete: false };

    // Retirer le joueur
    room.players = room.players.filter(p => p.id !== playerId);
    this.playerRooms.delete(playerId);

    // Nettoyer les votes liés à ce joueur
    // 1. Supprimer le vote du joueur qui part
    delete room.votes[playerId];

    // 2. Supprimer les votes des autres qui ont voté pour ce joueur
    Object.keys(room.votes).forEach(voterId => {
      if (room.votes[voterId] === playerId) {
        delete room.votes[voterId];
      }
    });

    // Si la room est vide, la supprimer
    if (room.players.length === 0) {
      this.rooms.delete(roomCode);
      return { room: null, shouldDelete: true };
    }

    // Si le host part, assigner un nouveau host
    if (room.hostId === playerId && room.players.length > 0) {
      room.hostId = room.players[0].id;
      room.players[0].isHost = true;
    }

    return { room, shouldDelete: false };
  }

  // Expulser un joueur (seulement par l'hôte)
  kickPlayer(hostId: string, playerIdToKick: string): { room: Room | null; kicked: boolean } {
    const roomCode = this.playerRooms.get(hostId);
    if (!roomCode) return { room: null, kicked: false };

    const room = this.rooms.get(roomCode);
    if (!room || room.hostId !== hostId) return { room: null, kicked: false };

    // Vérifier que le joueur à expulser existe et n'est pas l'hôte
    const playerToKick = room.players.find(p => p.id === playerIdToKick);
    if (!playerToKick || playerIdToKick === hostId) {
      return { room: null, kicked: false };
    }

    // Utiliser la logique de leaveRoom pour retirer le joueur
    room.players = room.players.filter(p => p.id !== playerIdToKick);
    this.playerRooms.delete(playerIdToKick);

    // Nettoyer les votes liés à ce joueur
    delete room.votes[playerIdToKick];
    Object.keys(room.votes).forEach(voterId => {
      if (room.votes[voterId] === playerIdToKick) {
        delete room.votes[voterId];
      }
    });

    return { room, kicked: true };
  }

  // Régénérer le code d'une room (seulement par l'hôte)
  regenerateCode(hostId: string): { room: Room | null; oldCode: string | null } {
    const oldCode = this.playerRooms.get(hostId);
    if (!oldCode) return { room: null, oldCode: null };

    const room = this.rooms.get(oldCode);
    if (!room || room.hostId !== hostId) return { room: null, oldCode: null };

    // Générer un nouveau code unique
    const newCode = this.generateRoomCode();

    // Supprimer l'ancienne entrée dans la map des rooms
    this.rooms.delete(oldCode);

    // Mettre à jour le code de la room
    room.code = newCode;

    // Ajouter la room avec le nouveau code
    this.rooms.set(newCode, room);

    // Mettre à jour les associations joueur -> roomCode
    room.players.forEach(player => {
      this.playerRooms.set(player.id, newCode);
    });

    return { room, oldCode };
  }

  // Mettre à jour les settings (seulement le host)
  updateSettings(playerId: string, settings: RoomSettings): Room | null {
    const roomCode = this.playerRooms.get(playerId);
    if (!roomCode) return null;

    const room = this.rooms.get(roomCode);
    if (!room || room.hostId !== playerId) return null;

    room.settings = settings;
    return room;
  }

  // Démarrer le jeu
  startGame(playerId: string): { room: Room; question?: Question } | null {
    const roomCode = this.playerRooms.get(playerId);
    if (!roomCode) return null;

    const room = this.rooms.get(roomCode);
    if (!room || room.hostId !== playerId || room.players.length < 2) return null;

    // Vérifier si la catégorie custom est sélectionnée
    if (room.settings.categories.includes('custom')) {
      room.status = 'custom-questions';
      room.customQuestions = [];
      return { room };
    }

    room.status = 'playing';
    room.currentQuestionIndex = 0;
    room.votes = {};
    room.results = [];

    // Générer les questions
    const questionData = getRandomQuestions(
      room.settings.categories,
      room.settings.numberOfQuestions
    );

    // Créer la première question
    const firstQuestionData = questionData[0];
    const question: Question = {
      id: nanoid(),
      text: `Qui est le plus ${firstQuestionData.adjective} ?`,
      adjective: firstQuestionData.adjective,
      category: firstQuestionData.category
    };

    room.currentQuestion = question;

    // Stocker toutes les questions pour la room (on pourrait les stocker dans la room)
    (room as any).allQuestions = questionData;

    return { room, question };
  }

  // Ajouter une question personnalisée
  addCustomQuestion(playerId: string, adjective: string): Room | null {
    const roomCode = this.playerRooms.get(playerId);
    if (!roomCode) return null;

    const room = this.rooms.get(roomCode);
    if (!room || room.status !== 'custom-questions') return null;

    // Initialiser le tableau si nécessaire
    if (!room.customQuestions) {
      room.customQuestions = [];
    }

    // Vérifier qu'on n'a pas déjà atteint le nombre de questions requis
    if (room.customQuestions.length >= room.settings.numberOfQuestions) {
      return null;
    }

    room.customQuestions.push(adjective);
    return room;
  }

  // Supprimer une question personnalisée
  removeCustomQuestion(playerId: string, index: number): Room | null {
    const roomCode = this.playerRooms.get(playerId);
    if (!roomCode) return null;

    const room = this.rooms.get(roomCode);
    if (!room || room.status !== 'custom-questions') return null;

    if (!room.customQuestions || index < 0 || index >= room.customQuestions.length) {
      return null;
    }

    room.customQuestions.splice(index, 1);
    return room;
  }

  // Démarrer le jeu avec les questions personnalisées
  startGameWithCustomQuestions(playerId: string): { room: Room; question: Question } | null {
    const roomCode = this.playerRooms.get(playerId);
    if (!roomCode) return null;

    const room = this.rooms.get(roomCode);
    if (!room || room.hostId !== playerId) return null;

    // Vérifier qu'on a assez de questions
    if (!room.customQuestions || room.customQuestions.length < room.settings.numberOfQuestions) {
      return null;
    }

    room.status = 'playing';
    room.currentQuestionIndex = 0;
    room.votes = {};
    room.results = [];

    // Créer les questions à partir des adjectifs personnalisés
    const questionData = room.customQuestions.map(adjective => ({
      adjective,
      category: 'custom' as const
    }));

    // Créer la première question
    const firstQuestionData = questionData[0];
    const question: Question = {
      id: nanoid(),
      text: `Qui est le plus ${firstQuestionData.adjective} ?`,
      adjective: firstQuestionData.adjective,
      category: firstQuestionData.category
    };

    room.currentQuestion = question;

    // Stocker toutes les questions pour la room
    (room as any).allQuestions = questionData;

    return { room, question };
  }

  // Voter pour un joueur
  vote(playerId: string, targetPlayerId: string): Room | null {
    const roomCode = this.playerRooms.get(playerId);
    if (!roomCode) return null;

    const room = this.rooms.get(roomCode);
    if (!room || room.status !== 'playing') return null;

    // Vérifier que la cible existe dans la room
    const targetExists = room.players.some(p => p.id === targetPlayerId);
    if (!targetExists) return null;

    room.votes[playerId] = targetPlayerId;
    return room;
  }

  // Vérifier si tous les joueurs ont voté
  hasEveryoneVoted(roomCode: string): boolean {
    const room = this.rooms.get(roomCode);
    if (!room) return false;

    return room.players.every(player => room.votes[player.id] !== undefined);
  }

  // Calculer les résultats de la question actuelle
  calculateResults(roomCode: string): QuestionResult | null {
    const room = this.rooms.get(roomCode);
    if (!room || !room.currentQuestion) return null;

    // Compter les votes
    const voteCounts: Record<string, number> = {};
    room.players.forEach(player => {
      voteCounts[player.id] = 0;
    });

    Object.values(room.votes).forEach(targetId => {
      voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
    });

    // Créer le classement
    const ranking = room.players
      .map(player => ({
        player,
        votes: voteCounts[player.id] || 0
      }))
      .sort((a, b) => b.votes - a.votes);

    const result: QuestionResult = {
      question: room.currentQuestion,
      votes: voteCounts,
      ranking
    };

    room.results.push(result);
    room.status = 'results';

    return result;
  }

  // Passer à la question suivante
  nextQuestion(playerId: string): { room: Room; question?: Question; finished: boolean } | null {
    const roomCode = this.playerRooms.get(playerId);
    if (!roomCode) return null;

    const room = this.rooms.get(roomCode);
    if (!room || room.hostId !== playerId) return null;

    room.currentQuestionIndex++;
    room.votes = {};

    const allQuestions = (room as any).allQuestions || [];

    // Vérifier s'il reste des questions
    if (room.currentQuestionIndex >= allQuestions.length) {
      room.status = 'finished';
      return { room, finished: true };
    }

    // Créer la prochaine question
    const questionData = allQuestions[room.currentQuestionIndex];
    const question: Question = {
      id: nanoid(),
      text: `Qui est le plus ${questionData.adjective} ?`,
      adjective: questionData.adjective,
      category: questionData.category
    };

    room.currentQuestion = question;
    room.status = 'playing';

    return { room, question, finished: false };
  }

  // Réinitialiser une room pour une nouvelle partie
  resetRoom(playerId: string): Room | null {
    const roomCode = this.playerRooms.get(playerId);
    if (!roomCode) return null;

    const room = this.rooms.get(roomCode);
    if (!room || room.hostId !== playerId) return null;

    // Réinitialiser la room au lobby
    room.status = 'lobby';
    room.currentQuestionIndex = 0;
    room.currentQuestion = undefined;
    room.votes = {};
    room.results = [];
    room.customQuestions = undefined;
    delete (room as any).allQuestions;

    return room;
  }

  // Récupérer une room
  getRoom(code: string): Room | undefined {
    return this.rooms.get(code.toUpperCase());
  }

  // Récupérer la room d'un joueur
  getPlayerRoom(playerId: string): Room | undefined {
    const roomCode = this.playerRooms.get(playerId);
    if (!roomCode) return undefined;
    return this.rooms.get(roomCode);
  }
}
