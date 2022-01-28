FROM node:16.13.2-alpine3.14

WORKDIR /usr/src/app

COPY src *.json ./

RUN npm ci --ignore-scripts && \
    npm run build && \
    npm prune --production && \
    npm cache clean --force

CMD [ "npm", "start" ]
