FROM node:14-alpine

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install --production

COPY . .

RUN npm run build && \
    npm prune --production && \
    npm uninstall -g npm && \
    rm -rf /root/.npm /root/.node-gyp /tmp/*

CMD ["./cp-minions"]
