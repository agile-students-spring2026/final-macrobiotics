FROM node:22-bookworm-slim

ENV NODE_ENV=production

WORKDIR /app

COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi

COPY . .

EXPOSE 3000

CMD ["npm", "run", "serve"]
