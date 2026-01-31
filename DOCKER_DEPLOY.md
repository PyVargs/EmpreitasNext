# Deploy Docker - EmpreitasNext

## Arquivos criados

| Arquivo | Descrição |
|---------|-----------|
| `Dockerfile` | Build da imagem Next.js |
| `docker-compose.yml` | Container da aplicação |
| `docker-compose.db.yml` | Container PostgreSQL |
| `.env.docker` | Template de variáveis para VPS |
| `deploy.sh` | Script de orquestração |
| `.dockerignore` | Arquivos ignorados no build |

---

## 1. Configurar GitHub Container Registry (GHCR)

### Criar Personal Access Token
1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token com permissões: `write:packages`, `read:packages`, `delete:packages`
3. Copie o token gerado

### Login no GHCR (máquina local)
```bash
echo "SEU_TOKEN_AQUI" | docker login ghcr.io -u PyVargs --password-stdin
```

---

## 2. Build e Push da Imagem (máquina local)

```bash
# Dar permissão ao script
chmod +x deploy.sh

# Build da imagem
./deploy.sh build

# Push para GHCR
./deploy.sh push

# Ou fazer ambos de uma vez
./deploy.sh deploy
```

Após o primeiro push, a imagem estará em:
```
ghcr.io/pyvargs/empreitasnext:latest
```

---

## 3. Configurar VPS

### Copiar arquivos para VPS
```bash
# Na sua máquina local
scp docker-compose.yml docker-compose.db.yml .env.docker deploy.sh usuario@sua-vps:/opt/empreitas/
```

### Na VPS
```bash
# Acessar VPS
ssh usuario@sua-vps

# Ir para diretório
cd /opt/empreitas

# Renomear .env
mv .env.docker .env

# Editar .env se necessário (trocar senha do banco, etc)
nano .env

# Dar permissão ao script
chmod +x deploy.sh
```

### Login no GHCR (na VPS)
```bash
echo "SEU_TOKEN_AQUI" | docker login ghcr.io -u PyVargs --password-stdin
```

---

## 4. Iniciar Serviços na VPS

```bash
# Iniciar banco de dados primeiro
./deploy.sh start-db

# Aguardar ~10 segundos para o banco inicializar

# Iniciar aplicação
./deploy.sh start-app

# Ou iniciar tudo de uma vez
./deploy.sh start-all
```

---

## 5. Comandos Úteis

```bash
# Ver status dos containers
./deploy.sh status

# Ver logs da aplicação
./deploy.sh logs

# Ver logs do banco
./deploy.sh logs-db

# Parar tudo
./deploy.sh stop-all

# Atualizar aplicação (após novo push)
docker compose pull
docker compose up -d
```

---

## 6. Configurar Nginx (Reverse Proxy)

Exemplo de configuração Nginx para `empreitas.jbxstudio.com.br`:

```nginx
server {
    listen 80;
    server_name empreitas.jbxstudio.com.br;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name empreitas.jbxstudio.com.br;

    ssl_certificate /etc/letsencrypt/live/empreitas.jbxstudio.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/empreitas.jbxstudio.com.br/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 7. Migração do Banco de Dados

Se você tem dados no Render que precisa migrar:

```bash
# Exportar do Render
pg_dump -h dpg-xxx.oregon-postgres.render.com -U empreitas2 -d database_4tpr > backup.sql

# Importar no novo container
docker exec -i empreitas-db psql -U empreitas -d empreitas_db < backup.sql
```

---

## Troubleshooting

### Container não inicia
```bash
docker logs empreitas-app
docker logs empreitas-db
```

### Banco não conecta
Verifique se o `DATABASE_URL` no `.env` está usando o hostname correto: `empreitas-db` (não `localhost`)

### Permissão negada no GHCR
```bash
# Re-autenticar
docker logout ghcr.io
echo "TOKEN" | docker login ghcr.io -u PyVargs --password-stdin
```
