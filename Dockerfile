FROM node:20-alpine AS base

WORKDIR /app

# Copier les package.json
COPY client/package*.json ./client/
COPY server/package*.json ./server/

# Installer les dépendances
RUN npm ci --prefix client --include=dev
RUN npm ci --prefix server --include=dev

# Copier le code source
COPY client ./client
COPY server ./server
COPY shared ./shared

# Build client et server
RUN npm run build --prefix client
RUN npm run build --prefix server

# Nettoyer les devDependencies pour la production
RUN npm ci --prefix server --omit=dev

# Exposer le port
EXPOSE 3000

# Variable d'environnement
ENV NODE_ENV=production

# Démarrer l'application
CMD ["node", "server/dist/server/src/index.js"]
