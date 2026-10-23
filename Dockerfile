
# ============================================================
# RYVORA - ULTIMATE METHODS
# Production Dockerfile for Railway
# Node.js 22 / Discord.js v14
# ============================================================

FROM node:22-bookworm-slim

# ------------------------------------------------------------
# Environment
# ------------------------------------------------------------

ENV NODE_ENV=production \
    NPM_CONFIG_UPDATE_NOTIFIER=false \
    NPM_CONFIG_FUND=false \
    NPM_CONFIG_AUDIT=false \
    RYVORA_DATA_DIR=/app/data

# ------------------------------------------------------------
# Application directory
# ------------------------------------------------------------

WORKDIR /app

# ------------------------------------------------------------
# Install production dependencies
# ------------------------------------------------------------

COPY package.json package-lock.json ./

RUN npm ci \
    --omit=dev \
    --no-audit \
    --no-fund \
    && npm cache clean --force

# ------------------------------------------------------------
# Copy application
# ------------------------------------------------------------

COPY --chown=node:node index.js ./

COPY --chown=node:node ryvora_support.png ./

COPY --chown=node:node images/ ./images/

# ------------------------------------------------------------
# Create writable persistent-data directory
# ------------------------------------------------------------

RUN mkdir -p /app/data \
    && chown -R node:node /app \
    && chmod 750 /app/data

# ------------------------------------------------------------
# Validate JavaScript before deployment
# ------------------------------------------------------------

RUN node --check /app/index.js

# ------------------------------------------------------------
# Security
# ------------------------------------------------------------

USER node

# ------------------------------------------------------------
# Runtime
# ------------------------------------------------------------

STOPSIGNAL SIGTERM

CMD ["node", "index.js"]
