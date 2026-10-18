FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
COPY . .

# Gunakan node_modules yang sudah terinstal pada workspace, atau jalankan npm install jika belum tersedia
RUN if [ ! -d "node_modules/express" ]; then npm install --omit=dev --no-audit --no-fund; fi

EXPOSE 5000

ENV NODE_ENV=production
ENV PORT=5000

CMD ["node", "src/index.js"]
