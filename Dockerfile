FROM node:16.13.2-alpine3.14

WORKDIR /usr/src/app

COPY src *.json ./

RUN npm ci && npm run build

CMD [ "npm", "start" ]
