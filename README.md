# 🎮 QUI EST LE PLUS

Un jeu multijoueur en ligne pour mieux se connaître entre amis ! Répondez à des questions fun en votant pour le joueur qui correspond le mieux à chaque adjectif.

## 🌟 Fonctionnalités

- **Rooms privées** : Créez une partie et partagez le code avec vos amis
- **Multijoueur en temps réel** : Jusqu'à X joueurs simultanés
- **Profils personnalisés** : Ajoutez votre nom et photo
- **Catégories variées** :
  - 😊 Soft (questions amicales)
  - 🎯 Classique (questions neutres)
  - 😈 Humour noir
  - 🔥 Hard (questions osées)
  - 🚫 Politiquement incorrect
- **Settings personnalisables** : L'hôte choisit le nombre de questions et les catégories
- **Résultats en temps réel** : Classement animé après chaque question
- **Design cartoon** : Interface colorée et fun

## 🚀 Installation

### Prérequis

- Node.js 18+
- npm ou yarn

### Installation

1. Cloner le repo
```bash
git clone <url-du-repo>
cd qui_est_le_plus
```

2. Installer les dépendances du serveur
```bash
cd server
npm install
```

3. Installer les dépendances du client
```bash
cd ../client
npm install
```

## 🎯 Lancement

### Démarrer le serveur backend

```bash
cd server
npm run dev
```

Le serveur démarre sur `http://localhost:3000`

### Démarrer le client frontend

```bash
cd client
npm run dev
```

Le client démarre sur `http://localhost:5173`

## 🎮 Comment jouer

1. **Créer une partie** : Cliquez sur "Créer une partie" et entrez votre nom
2. **Partager le code** : Partagez le code de 6 caractères avec vos amis
3. **Rejoindre** : Vos amis peuvent rejoindre avec le code
4. **Configurer** : L'hôte configure le nombre de questions et les catégories
5. **Jouer** : Votez pour le joueur qui correspond le mieux à chaque question
6. **Résultats** : Découvrez qui a gagné chaque question !

## 🛠️ Stack Technique

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- Socket.io Client
- React Router

### Backend
- Node.js
- Express
- Socket.io
- TypeScript

## 📁 Structure du projet

```
qui_est_le_plus/
├── client/           # Application React
│   ├── src/
│   │   ├── pages/    # Pages (Home, Lobby, Game, Results)
│   │   ├── context/  # Context Socket.io
│   │   └── types.ts  # Types TypeScript
│   └── ...
├── server/           # Backend Node.js
│   ├── src/
│   │   ├── data/     # Questions par catégorie
│   │   ├── roomManager.ts
│   │   └── index.ts
│   └── ...
└── shared/           # Types partagés
```

## 🎨 Design

Le jeu utilise un design cartoon avec :
- Polices Google Fonts : Fredoka, Bubblegum Sans, Comic Neue
- Palette de couleurs vives : violet, rose, orange
- Animations et transitions fluides
- Interface responsive

## 📝 TODO / Améliorations futures

- [ ] Ajouter un système de scores cumulés
- [ ] Permettre de rejouer sans recréer une room
- [ ] Ajouter plus de catégories et questions
- [ ] Sauvegarder l'historique des parties
- [ ] Ajouter des animations plus poussées
- [ ] Mode "Révélation" : afficher qui a voté pour qui
- [ ] Statistiques de fin de partie

## 📄 License

MIT
