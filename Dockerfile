FROM balena/open-balena-base:no-systemd-v17.0.1

WORKDIR /usr/src/app

COPY docker-hc ./
RUN chmod +x docker-hc

COPY *.json ./
COPY src/ src/

RUN npm ci --ignore-scripts && \
    npm run build && \
    npm prune --production && \
    npm cache clean --force

CMD [ "npm", "start" ]
