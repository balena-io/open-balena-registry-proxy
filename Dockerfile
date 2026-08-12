FROM balena/open-balena-base:21.0.32-no-init@sha256:c68f59dead7300736ac1d1f70f1fc53a10f1417bf8e445dbd351b755aeaa5895

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
