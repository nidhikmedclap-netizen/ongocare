# Dev/reference image: runs token-server.mjs. If production uses server/index.js, COPY it and set CMD ["node", "index.js"] — see AGENT_SERVER_VOICE_VOICEMAIL.md.
FROM node:20-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY token-server.mjs ./
ENV NODE_ENV=production
EXPOSE 3001
CMD ["node", "token-server.mjs"]
