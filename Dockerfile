FROM balena/open-balena-base:20.2.8-no-init

WORKDIR /usr/src/app

COPY docker-hc ./
RUN chmod +x docker-hc

COPY *.json ./
COPY src/ src/

RUN npm ci --ignore-scripts && \
    npm run build && \
    npm prune --omit=dev && \
    npm cache clean --force

CMD [ "npm", "start" ]
