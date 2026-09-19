FROM balena/open-balena-base:21.0.36-no-init@sha256:48d1143978874f370e23fc03f0947b60ffb6075ce1d8d02074642b34b11c297e

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
