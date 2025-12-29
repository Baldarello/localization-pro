# --- Stage 1: Build ---
FROM node:22-alpine AS builder

WORKDIR /app

# Copia i file di dipendenze
COPY package*.json ./

# Installa le dipendenze
RUN npm install

# Copia il codice sorgente
COPY . .

# Argomenti di build per le variabili d'ambiente (necessari per Vite durante la build)
# Possono essere passati con --build-arg
ARG GEMINI_API_KEY
ARG REACT_APP_IS_PROD=true

# Imposta le variabili d'ambiente per il processo di build
ENV GEMINI_API_KEY=$GEMINI_API_KEY
ENV REACT_APP_IS_PROD=$REACT_APP_IS_PROD

# Esegue la build (crea la cartella /dist)
RUN npm run build

# --- Stage 2: Production ---
FROM node:22-alpine

WORKDIR /app

# Installa 'serve', un server statico leggero
RUN npm install -g serve

# Copia i file buildati dallo stage precedente
COPY --from=builder /app/dist ./dist

# Variabile per la porta (serve usa 3000 di default, ma noi esponiamo 5173 come richiesto)
ENV PORT=5173

# Espone la porta
EXPOSE 5173

# Avvia il server statico sulla porta specificata
CMD ["serve", "-s", "dist", "-l", "5173"]
