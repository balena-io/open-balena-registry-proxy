FROM balena/open-balena-base:21.0.35-no-init@sha256:0cea9fecba42cd7d5d9d99cf23da02d90ae8c6b60ea0e495e7a96f0660adc0cb

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
