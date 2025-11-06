# Guide de déploiement automatique avec Nixpacks

Ce projet est configuré pour un déploiement automatique sur VPS à chaque push Git.

## Configuration Nixpacks

Le fichier `nixpacks.toml` définit le processus de build :

1. **Setup** : Installation de Node.js 20
2. **Install** : Installation des dépendances client et serveur
3. **Build** : Build du client React et du serveur TypeScript
4. **Start** : Démarrage du serveur en mode production

## Structure de déploiement

- Le client React est build en fichiers statiques (`client/dist/`)
- Le serveur Express sert ces fichiers statiques en production
- Socket.IO gère la communication temps réel
- Un seul port (3000 par défaut) pour le client et le serveur

## Variables d'environnement

### Sur votre VPS

Configurez ces variables d'environnement :

```bash
NODE_ENV=production
PORT=3000  # ou le port de votre choix
```

### Variables optionnelles

- `VITE_SOCKET_URL` : URL du serveur WebSocket (optionnel en production, utilise l'origine actuelle par défaut)
- `CLIENT_URL` : URL du client pour CORS (optionnel)

## Configuration du VPS

### Option 1 : Coolify / Dokku / CapRover

Ces plateformes supportent Nixpacks nativement :

1. Connectez votre repo GitHub
2. Configurez les variables d'environnement
3. Le déploiement se fera automatiquement à chaque push

### Option 2 : GitHub Actions + VPS manuel

Créez `.github/workflows/deploy.yml` :

```yaml
name: Deploy to VPS

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Deploy to VPS
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /path/to/qui_est_le_plus
            git pull
            nixpacks build . --name qui-est-le-plus
            docker stop qui-est-le-plus || true
            docker rm qui-est-le-plus || true
            docker run -d \
              --name qui-est-le-plus \
              -p 3000:3000 \
              -e NODE_ENV=production \
              --restart unless-stopped \
              qui-est-le-plus
```

### Option 3 : Webhook Git + Script de déploiement

Sur votre VPS, créez un script `deploy.sh` :

```bash
#!/bin/bash

cd /path/to/qui_est_le_plus
git pull origin main

# Build avec Nixpacks
nixpacks build . --name qui-est-le-plus

# Arrêter et redémarrer le conteneur
docker stop qui-est-le-plus || true
docker rm qui-est-le-plus || true

docker run -d \
  --name qui-est-le-plus \
  -p 3000:3000 \
  -e NODE_ENV=production \
  --restart unless-stopped \
  qui-est-le-plus

echo "Déploiement terminé !"
```

Puis configurez un webhook GitHub pour appeler ce script.

## Test en local

Pour tester le build Nixpacks localement :

```bash
# Installer Nixpacks
curl -sSL https://nixpacks.com/install.sh | bash

# Build l'image
nixpacks build . --name qui-est-le-plus

# Lancer le conteneur
docker run -p 3000:3000 -e NODE_ENV=production qui-est-le-plus
```

## Reverse Proxy (Nginx)

Configuration Nginx recommandée pour servir l'application :

```nginx
server {
    listen 80;
    server_name votre-domaine.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket support
    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

## SSL avec Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d votre-domaine.com
```

## Monitoring

Pour surveiller l'application :

```bash
# Logs du conteneur
docker logs -f qui-est-le-plus

# Statistiques
docker stats qui-est-le-plus
```

## Troubleshooting

### Le serveur ne démarre pas

Vérifiez les logs :
```bash
docker logs qui-est-le-plus
```

### Les WebSockets ne fonctionnent pas

Vérifiez que le reverse proxy supporte WebSocket (voir config Nginx ci-dessus)

### Le client ne se connecte pas au serveur

En production, le client se connecte automatiquement à l'origine actuelle. Assurez-vous que :
- Le serveur écoute sur le bon port
- Le reverse proxy est correctement configuré
- CORS est configuré si nécessaire
