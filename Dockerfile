FROM balena/open-balena-base:21.0.28-no-init@sha256:6240ac69df72646ce92ff728d82e1f3bc4c09895d66769e945e4f43e0d213156

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
