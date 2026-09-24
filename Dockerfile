FROM balena/open-balena-base:22.0.0-no-init@sha256:a28519993f5d5ddc6c68cd3d43e65658ad6241aca70532ebc027403ab21b6ce3

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
