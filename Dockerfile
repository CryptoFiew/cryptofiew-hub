FROM node:16-alpine

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci --only=production

COPY . .

RUN npm prune --production && \
    npm uninstall -g npm && \
    rm -rf /root/.npm /root/.node-gyp /tmp/*

CMD ["node", "index.js"]