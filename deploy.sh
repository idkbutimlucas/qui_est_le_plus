#!/bin/bash

echo "🚀 Déploiement de Qui est le plus..."

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Vérifier si Nixpacks est installé
if ! command -v nixpacks &> /dev/null; then
    echo -e "${RED}❌ Nixpacks n'est pas installé${NC}"
    echo "Installation de Nixpacks..."
    curl -sSL https://nixpacks.com/install.sh | bash
fi

# Vérifier si Docker est installé
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker n'est pas installé. Veuillez installer Docker.${NC}"
    exit 1
fi

echo -e "${BLUE}📦 Build de l'application avec Nixpacks...${NC}"
nixpacks build . --name qui-est-le-plus

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erreur lors du build${NC}"
    exit 1
fi

echo -e "${BLUE}🛑 Arrêt du conteneur existant...${NC}"
docker stop qui-est-le-plus 2>/dev/null || true
docker rm qui-est-le-plus 2>/dev/null || true

echo -e "${BLUE}🚀 Démarrage du nouveau conteneur...${NC}"
docker run -d \
  --name qui-est-le-plus \
  -p 3000:3000 \
  -e NODE_ENV=production \
  --restart unless-stopped \
  qui-est-le-plus

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erreur lors du démarrage${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Déploiement réussi !${NC}"
echo -e "${GREEN}🌐 Application accessible sur http://localhost:3000${NC}"
echo ""
echo "Pour voir les logs :"
echo "  docker logs -f qui-est-le-plus"
echo ""
echo "Pour arrêter l'application :"
echo "  docker stop qui-est-le-plus"
