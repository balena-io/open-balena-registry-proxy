FROM balena/open-balena-base:v13.0.5

WORKDIR /usr/src/app

COPY *.json ./
COPY src/ src/

RUN npm ci --ignore-scripts && \
    npm run build && \
    npm prune --production && \
    npm cache clean --force

CMD [ "npm", "start" ]
