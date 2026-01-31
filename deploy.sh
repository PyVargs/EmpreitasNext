#!/bin/bash
# ============================================
# Script de Deploy - EmpreitasNext
# Build, Push para GHCR e Deploy na VPS
# ============================================

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configurações
IMAGE_NAME="ghcr.io/pyvargs/empreitasnext"
IMAGE_TAG="${1:-latest}"
FULL_IMAGE="${IMAGE_NAME}:${IMAGE_TAG}"

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}   EmpreitasNext - Deploy Script${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# Função de ajuda
show_help() {
    echo "Uso: ./deploy.sh [COMANDO] [TAG]"
    echo ""
    echo "Comandos:"
    echo "  build       - Build da imagem Docker"
    echo "  push        - Push da imagem para GHCR"
    echo "  deploy      - Build + Push"
    echo "  start-db    - Inicia o container PostgreSQL"
    echo "  start-app   - Inicia o container da aplicação"
    echo "  start-all   - Inicia banco + aplicação"
    echo "  stop-all    - Para todos os containers"
    echo "  logs        - Mostra logs da aplicação"
    echo "  logs-db     - Mostra logs do banco"
    echo "  migrate     - Executa migrations do Prisma"
    echo "  status      - Status dos containers"
    echo ""
    echo "Exemplos:"
    echo "  ./deploy.sh build latest"
    echo "  ./deploy.sh push v1.0.0"
    echo "  ./deploy.sh deploy"
    echo "  ./deploy.sh start-all"
}

# Verificar login no GHCR
check_ghcr_login() {
    echo -e "${YELLOW}Verificando autenticação no GHCR...${NC}"
    if ! docker info 2>/dev/null | grep -q "ghcr.io"; then
        echo -e "${RED}Você precisa fazer login no GHCR primeiro:${NC}"
        echo "  echo \$GITHUB_TOKEN | docker login ghcr.io -u YOUR_USERNAME --password-stdin"
        exit 1
    fi
    echo -e "${GREEN}✓ Autenticado no GHCR${NC}"
}

# Build da imagem
build_image() {
    echo -e "${YELLOW}Building image: ${FULL_IMAGE}${NC}"
    docker build -t ${FULL_IMAGE} -t ${IMAGE_NAME}:latest .
    echo -e "${GREEN}✓ Build concluído: ${FULL_IMAGE}${NC}"
}

# Push para GHCR
push_image() {
    check_ghcr_login
    echo -e "${YELLOW}Pushing image: ${FULL_IMAGE}${NC}"
    docker push ${FULL_IMAGE}
    if [ "${IMAGE_TAG}" != "latest" ]; then
        docker push ${IMAGE_NAME}:latest
    fi
    echo -e "${GREEN}✓ Push concluído: ${FULL_IMAGE}${NC}"
}

# Criar rede se não existir
create_network() {
    if ! docker network inspect empreitas-network >/dev/null 2>&1; then
        echo -e "${YELLOW}Criando rede Docker...${NC}"
        docker network create empreitas-network
        echo -e "${GREEN}✓ Rede criada${NC}"
    fi
}

# Iniciar banco de dados
start_db() {
    create_network
    echo -e "${YELLOW}Iniciando PostgreSQL...${NC}"
    docker compose -f docker-compose.db.yml up -d
    echo -e "${GREEN}✓ PostgreSQL iniciado${NC}"
    echo -e "${YELLOW}Aguardando banco ficar pronto...${NC}"
    sleep 5
    docker compose -f docker-compose.db.yml ps
}

# Iniciar aplicação
start_app() {
    create_network
    echo -e "${YELLOW}Iniciando aplicação...${NC}"
    docker compose up -d
    echo -e "${GREEN}✓ Aplicação iniciada${NC}"
    docker compose ps
}

# Iniciar tudo
start_all() {
    start_db
    echo ""
    start_app
    echo ""
    echo -e "${GREEN}============================================${NC}"
    echo -e "${GREEN}   Todos os serviços iniciados!${NC}"
    echo -e "${GREEN}============================================${NC}"
    echo -e "App: http://localhost:3000"
    echo -e "DB:  localhost:5432"
}

# Parar tudo
stop_all() {
    echo -e "${YELLOW}Parando todos os containers...${NC}"
    docker compose down
    docker compose -f docker-compose.db.yml down
    echo -e "${GREEN}✓ Containers parados${NC}"
}

# Logs da aplicação
show_logs() {
    docker compose logs -f empreitas-app
}

# Logs do banco
show_logs_db() {
    docker compose -f docker-compose.db.yml logs -f empreitas-db
}

# Executar migrations
run_migrate() {
    echo -e "${YELLOW}Executando migrations...${NC}"
    docker compose exec empreitas-app npx prisma migrate deploy
    echo -e "${GREEN}✓ Migrations executadas${NC}"
}

# Status dos containers
show_status() {
    echo -e "${BLUE}=== Status dos Containers ===${NC}"
    echo ""
    echo -e "${YELLOW}Banco de Dados:${NC}"
    docker compose -f docker-compose.db.yml ps
    echo ""
    echo -e "${YELLOW}Aplicação:${NC}"
    docker compose ps
}

# Main
case "${1:-help}" in
    build)
        build_image
        ;;
    push)
        push_image
        ;;
    deploy)
        build_image
        push_image
        ;;
    start-db)
        start_db
        ;;
    start-app)
        start_app
        ;;
    start-all)
        start_all
        ;;
    stop-all)
        stop_all
        ;;
    logs)
        show_logs
        ;;
    logs-db)
        show_logs_db
        ;;
    migrate)
        run_migrate
        ;;
    status)
        show_status
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        echo -e "${RED}Comando desconhecido: ${1}${NC}"
        echo ""
        show_help
        exit 1
        ;;
esac
