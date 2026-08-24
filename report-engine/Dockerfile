FROM node:24-alpine

WORKDIR /app

# Les dependances sont installees avant le code : une modification de source
# ne reconstruit pas la couche npm.
COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src

# Les rapports produits vivent dans un volume, pas dans l'image.
RUN mkdir -p reports

EXPOSE 3001
CMD ["node", "src/server.js"]
