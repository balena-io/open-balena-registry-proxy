FROM balena/open-balena-base:22.0.2-no-init@sha256:4f568bf2f00beaf2bd02dca275094c52783301aaac5dd39f0dfd6ec72a1e296a

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
