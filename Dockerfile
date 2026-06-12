FROM balena/open-balena-base:21.0.25-no-init@sha256:643dc3b71ce96e3de0bceec71b1fec90758d53704d8f172589b2f4435cfdf45b

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
