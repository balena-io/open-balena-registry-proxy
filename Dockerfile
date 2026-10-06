FROM balena/open-balena-base:22.0.1-no-init@sha256:1f0df821f157f7b998507e078af9fc58b490afdfb315c1bf715f22ab66205e8d

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
