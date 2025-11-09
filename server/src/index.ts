import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { RoomManager } from './roomManager.js';
import type { ServerToClientEvents, ClientToServerEvents } from '../../shared/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// Servir les fichiers statiques du client en production
if (process.env.NODE_ENV === 'production') {
  // En production Docker, on remonte à la racine /app puis client/dist
  const clientDistPath = path.join(__dirname, '../../../../client/dist');
  app.use(express.static(clientDistPath));
}

const roomManager = new RoomManager();

// Socket.io connection
io.on('connection', (socket) => {
  // Créer une room
  socket.on('room:create', (playerName, avatar) => {
    try {
      const room = roomManager.createRoom(socket.id, playerName, avatar);
      socket.join(room.code);
      socket.emit('room:joined', room);
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

        // Si le jeu est en cours, vérifier si tout le monde a voté
        if (room.status === 'playing' && roomManager.hasEveryoneVoted(room.code)) {
          const result = roomManager.calculateResults(room.code);
          if (result) {
            io.to(room.code).emit('room:updated', room);
            io.to(room.code).emit('game:results', result);
          }
        }
      }
    } catch (error) {
      // Error handled silently
    }
  });

  // Expulser un joueur
  socket.on('room:kickPlayer', (playerIdToKick) => {
    try {
      const { room, kicked } = roomManager.kickPlayer(socket.id, playerIdToKick);
      if (!room || !kicked) {
        socket.emit('room:error', 'Impossible d\'expulser ce joueur');
        return;
      }

      // Notifier le joueur expulsé
      io.to(playerIdToKick).emit('room:kicked');

      // Déconnecter le joueur expulsé de la room socket
      const kickedSocket = io.sockets.sockets.get(playerIdToKick);
      if (kickedSocket) {
        kickedSocket.leave(room.code);
      }

      // Notifier tous les autres joueurs de la mise à jour
      io.to(room.code).emit('room:updated', room);

      // Si le jeu est en cours, vérifier si tout le monde a voté
      if (room.status === 'playing' && roomManager.hasEveryoneVoted(room.code)) {
        const result = roomManager.calculateResults(room.code);
        if (result) {
          io.to(room.code).emit('room:updated', room);
          io.to(room.code).emit('game:results', result);
        }
      }
    } catch (error) {
      socket.emit('room:error', 'Erreur lors de l\'expulsion du joueur');
    }
  });

  // Régénérer le code de la room
  socket.on('room:regenerateCode', () => {
    try {
      const { room, oldCode } = roomManager.regenerateCode(socket.id);
      if (!room || !oldCode) {
        socket.emit('room:error', 'Impossible de régénérer le code');
        return;
      }

      // Faire quitter tous les joueurs de l'ancienne room socket
      room.players.forEach(player => {
        const playerSocket = io.sockets.sockets.get(player.id);
        if (playerSocket) {
          playerSocket.leave(oldCode);
          playerSocket.join(room.code);
        }
      });

      // Notifier tous les joueurs de la mise à jour avec le nouveau code
      io.to(room.code).emit('room:updated', room);
    } catch (error) {
      socket.emit('room:error', 'Erreur lors de la régénération du code');
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

      // Si c'est une catégorie custom, on ne démarre pas directement le jeu
      if (room.status !== 'custom-questions' && question) {
        io.to(room.code).emit('game:question', question);

        // Démarrer le timer
        roomManager.startTimer(
          room.code,
          // Callback quand le timer expire
          () => {
            io.to(room.code).emit('game:timeExpired');

            // Calculer les résultats avec les votes actuels
            const result = roomManager.calculateResults(room.code);
            if (result) {
              io.to(room.code).emit('game:results', result);
              const updatedRoom = roomManager.getRoom(room.code);
              if (updatedRoom) {
                io.to(room.code).emit('room:updated', updatedRoom);
              }
            }
          },
          // Callback à chaque tick (chaque seconde)
          (timeRemaining) => {
            io.to(room.code).emit('game:timerUpdate', timeRemaining);
          }
        );
      }
    } catch (error) {
      socket.emit('room:error', 'Erreur lors du démarrage du jeu');
    }
  });

  // Ajouter une question personnalisée
  socket.on('custom:addQuestion', (adjective) => {
    try {
      const room = roomManager.addCustomQuestion(socket.id, adjective);
      if (!room) {
        socket.emit('room:error', 'Impossible d\'ajouter la question');
        return;
      }

      io.to(room.code).emit('room:updated', room);
      io.to(room.code).emit('custom:questionsUpdated', room.customQuestions || []);
    } catch (error) {
      socket.emit('room:error', 'Erreur lors de l\'ajout de la question');
    }
  });

  // Supprimer une question personnalisée
  socket.on('custom:removeQuestion', (index) => {
    try {
      const room = roomManager.removeCustomQuestion(socket.id, index);
      if (!room) {
        socket.emit('room:error', 'Impossible de supprimer la question');
        return;
      }

      io.to(room.code).emit('room:updated', room);
      io.to(room.code).emit('custom:questionsUpdated', room.customQuestions || []);
    } catch (error) {
      socket.emit('room:error', 'Erreur lors de la suppression de la question');
    }
  });

  // Démarrer le jeu avec les questions personnalisées
  socket.on('custom:startGame', () => {
    try {
      const result = roomManager.startGameWithCustomQuestions(socket.id);
      if (!result) {
        socket.emit('room:error', 'Impossible de démarrer le jeu');
        return;
      }

      const { room, question } = result;
      io.to(room.code).emit('room:updated', room);
      io.to(room.code).emit('game:question', question);

      // Démarrer le timer
      roomManager.startTimer(
        room.code,
        // Callback quand le timer expire
        () => {
          io.to(room.code).emit('game:timeExpired');

          // Calculer les résultats avec les votes actuels
          const result = roomManager.calculateResults(room.code);
          if (result) {
            io.to(room.code).emit('game:results', result);
            const updatedRoom = roomManager.getRoom(room.code);
            if (updatedRoom) {
              io.to(room.code).emit('room:updated', updatedRoom);
            }
          }
        },
        // Callback à chaque tick (chaque seconde)
        (timeRemaining) => {
          io.to(room.code).emit('game:timerUpdate', timeRemaining);
        }
      );
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

      // Émettre immédiatement la mise à jour pour tous les joueurs
      io.to(room.code).emit('room:updated', room);

      // Vérifier si tout le monde a voté
      if (roomManager.hasEveryoneVoted(room.code)) {
        const result = roomManager.calculateResults(room.code);
        if (result) {
          io.to(room.code).emit('game:results', result);
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
      } else if (question) {
        io.to(room.code).emit('game:question', question);

        // Démarrer le timer pour la nouvelle question
        roomManager.startTimer(
          room.code,
          // Callback quand le timer expire
          () => {
            io.to(room.code).emit('game:timeExpired');

            // Calculer les résultats avec les votes actuels
            const result = roomManager.calculateResults(room.code);
            if (result) {
              io.to(room.code).emit('game:results', result);
              const updatedRoom = roomManager.getRoom(room.code);
              if (updatedRoom) {
                io.to(room.code).emit('room:updated', updatedRoom);
              }
            }
          },
          // Callback à chaque tick (chaque seconde)
          (timeRemaining) => {
            io.to(room.code).emit('game:timerUpdate', timeRemaining);
          }
        );
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
          }
        }
      }
    } catch (error) {
      // Error handled silently
    }
  });
});

// Routes API
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api', (req, res) => {
  res.json({
    message: 'API Qui est le plus - Serveur WebSocket',
    status: 'running',
    endpoints: {
      health: '/api/health',
      websocket: 'ws://localhost:3000'
    }
  });
});

// En production, servir le client React pour toutes les autres routes
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    const clientDistPath = path.join(__dirname, '../../../../client/dist');
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
