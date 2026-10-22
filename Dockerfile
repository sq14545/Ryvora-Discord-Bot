
FROM node:22-bookworm-slim

WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json ./

RUN npm ci --omit=dev --no-audit --no-fund \
    && npm cache clean --force

COPY --chown=node:node index.js ryvora_support.png ./

# Copy all Ryvora banner images
COPY --chown=node:node images/ ./images/

# Verify images are included in the container
RUN ls -la ./images/ && node --check index.js

USER node

CMD ["node", "index.js"]
