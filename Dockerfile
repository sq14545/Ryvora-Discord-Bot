
COPY --chown=node:node images/ ./images/

RUN ls -la ./images/ && node --check index.js

# Allow the bot to save tickets and state files
RUN chown -R node:node /app

USER node

CMD ["node", "index.js"]
