import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { RoomManager } from './roomManager.js';
import type { ServerToClientEvents, ClientToServerEvents } from '../../shared/types.js';

const app = express();
const httpServer = createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  },
  maxHttpBufferSize: 10e6 // 10MB au lieu de 1MB par défaut
});

app.use(cors());
app.use(express.json());

const roomManager = new RoomManager();

// Socket.io connection
io.on('connection', (socket) => {
  console.log(`Client connecté: ${socket.id}`);

  // Créer une room
  socket.on('room:create', (playerName, avatar) => {
    try {
      const room = roomManager.createRoom(socket.id, playerName, avatar);
      socket.join(room.code);
      socket.emit('room:joined', room);
      console.log(`Room créée: ${room.code} par ${playerName}`);
    } catch (error) {
      socket.emit('room:error', 'Erreur lors de la création de la room');
    }
  });

  // Rejoindre une room
  socket.on('room:join', (code, playerName, avatar) => {
    try {
      const room = roomManager.joinRoom(code, socket.id, playerName, avatar);
      if (!room) {
        socket.emit('room:error', 'Room introuvable');
        return;
      }

      socket.join(room.code);
      socket.emit('room:joined', room);

      // Notifier tous les joueurs de la room
      io.to(room.code).emit('room:updated', room);

      console.log(`${playerName} a rejoint la room ${room.code}`);
    } catch (error) {
      socket.emit('room:error', 'Erreur lors de la connexion à la room');
    }
  });

  // Mettre à jour les settings
  socket.on('room:updateSettings', (settings) => {
    try {
      const room = roomManager.updateSettings(socket.id, settings);
      if (!room) {
        socket.emit('room:error', 'Impossible de modifier les settings');
        return;
      }

      io.to(room.code).emit('room:updated', room);
      console.log(`Settings mis à jour pour la room ${room.code}`);
    } catch (error) {
      socket.emit('room:error', 'Erreur lors de la mise à jour des settings');
    }
  });

  // Quitter une room
  socket.on('room:leave', () => {
    try {
      const { room, shouldDelete } = roomManager.leaveRoom(socket.id);
      if (room) {
        socket.leave(room.code);
        io.to(room.code).emit('room:updated', room);
        console.log(`Joueur ${socket.id} a quitté la room ${room.code}`);

        // Si le jeu est en cours, vérifier si tout le monde a voté
        if (room.status === 'playing' && roomManager.hasEveryoneVoted(room.code)) {
          const result = roomManager.calculateResults(room.code);
          if (result) {
            io.to(room.code).emit('room:updated', room);
            io.to(room.code).emit('game:results', result);
            console.log(`Résultats calculés après départ d'un joueur dans la room ${room.code}`);
          }
        }
      }
    } catch (error) {
      console.error('Erreur lors du départ de la room:', error);
    }
  });

  // Démarrer le jeu
  socket.on('game:start', () => {
    try {
      const result = roomManager.startGame(socket.id);
      if (!result) {
        socket.emit('room:error', 'Impossible de démarrer le jeu (minimum 2 joueurs requis)');
        return;
      }

      const { room, question } = result;
      io.to(room.code).emit('room:updated', room);
      io.to(room.code).emit('game:question', question);

      console.log(`Jeu démarré dans la room ${room.code}`);
    } catch (error) {
      socket.emit('room:error', 'Erreur lors du démarrage du jeu');
    }
  });

  // Voter
  socket.on('game:vote', (targetPlayerId) => {
    try {
      const room = roomManager.vote(socket.id, targetPlayerId);
      if (!room) {
        socket.emit('room:error', 'Vote impossible');
        return;
      }

      // Vérifier si tout le monde a voté
      if (roomManager.hasEveryoneVoted(room.code)) {
        const result = roomManager.calculateResults(room.code);
        if (result) {
          io.to(room.code).emit('room:updated', room);
          io.to(room.code).emit('game:results', result);
          console.log(`Résultats calculés pour la room ${room.code}`);
        }
      }
    } catch (error) {
      socket.emit('room:error', 'Erreur lors du vote');
    }
  });

  // Question suivante
  socket.on('game:nextQuestion', () => {
    try {
      const result = roomManager.nextQuestion(socket.id);
      if (!result) {
        socket.emit('room:error', 'Impossible de passer à la question suivante');
        return;
      }

      const { room, question, finished } = result;
      io.to(room.code).emit('room:updated', room);

      if (finished) {
        io.to(room.code).emit('game:finished', room.results);
        console.log(`Jeu terminé dans la room ${room.code}`);
      } else if (question) {
        io.to(room.code).emit('game:question', question);
        console.log(`Nouvelle question dans la room ${room.code}`);
      }
    } catch (error) {
      socket.emit('room:error', 'Erreur lors du passage à la question suivante');
    }
  });

  // Retour au lobby
  socket.on('game:backToLobby', () => {
    try {
      const room = roomManager.resetRoom(socket.id);
      if (!room) {
        socket.emit('room:error', 'Impossible de retourner au lobby');
        return;
      }

      io.to(room.code).emit('room:updated', room);
      console.log(`Retour au lobby pour la room ${room.code}`);
    } catch (error) {
      socket.emit('room:error', 'Erreur lors du retour au lobby');
    }
  });

  // Déconnexion
  socket.on('disconnect', () => {
    try {
      const { room } = roomManager.leaveRoom(socket.id);
      if (room) {
        io.to(room.code).emit('room:updated', room);

        // Si le jeu est en cours, vérifier si tout le monde a voté
        if (room.status === 'playing' && roomManager.hasEveryoneVoted(room.code)) {
          const result = roomManager.calculateResults(room.code);
          if (result) {
            io.to(room.code).emit('room:updated', room);
            io.to(room.code).emit('game:results', result);
            console.log(`Résultats calculés après déconnexion d'un joueur dans la room ${room.code}`);
          }
        }
      }
      console.log(`Client déconnecté: ${socket.id}`);
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  });
});

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'API Qui est le plus - Serveur WebSocket',
    status: 'running',
    endpoints: {
      health: '/health',
      websocket: 'ws://localhost:3000'
    }
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
});
