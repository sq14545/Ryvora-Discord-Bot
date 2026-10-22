
FROM node:22-bookworm-slim

WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json ./

RUN npm ci --omit=dev --no-audit --no-fund

COPY --chown=node:node index.js ryvora_support.png ./

COPY --chown=node:node images/ ./images/

RUN node --check index.js

RUN chown -R node:node /app

USER node

CMD ["node", "index.js"]
