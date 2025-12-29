FROM node:22-alpine

WORKDIR /usr/src/app

# Copia i file di dipendenze
COPY package*.json ./

# Installa le dipendenze e aggiunge i driver per Postgres e MySQL necessari in produzione
RUN npm install && npm install pg pg-hstore mysql2

# Copia il codice sorgente del backend
COPY . .

# --- Variabili d'Ambiente (Defaults) ---
# Queste possono essere sovrascritte a runtime (es. docker-compose o k8s)

# Configurazione Server
ENV NODE_ENV=production
ENV PORT=3001
ENV FRONTEND_URL=http://localhost:5173
ENV SESSION_SECRET=change_me_to_a_secure_random_string

# Configurazione Database
# Dialect: postgres, mysql, o sqlite
ENV DB_DIALECT=postgres
ENV DB_HOST=postgres
ENV DB_PORT=5432
ENV DB_NAME=tntdb
ENV DB_USER=tntuser
ENV DB_PASS=tntpassword
ENV DB_SSL=false
ENV DB_LOGGING=false

# Integrazioni Opzionali (Google OAuth)
ENV GOOGLE_CLIENT_ID=""
ENV GOOGLE_CLIENT_SECRET=""

# Integrazioni Opzionali (Email SMTP)
ENV EMAIL_ENABLED=false
ENV EMAIL_HOST=""
ENV EMAIL_PORT=587
ENV EMAIL_SECURE=false
ENV EMAIL_USER=""
ENV EMAIL_PASS=""
ENV EMAIL_FROM="noreply@example.com"

# Espone la porta del backend
EXPOSE 3001

# Comando di avvio:
# 1. Esegue le migrazioni del database per aggiornare lo schema
# 2. Avvia il server in modalità produzione
CMD ["sh", "-c", "npm run db:migrate && npm run start:prod"]
