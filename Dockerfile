FROM balena/open-balena-base:21.0.37-no-init@sha256:e78e19b90f04a0a68eb1a133d05f45dc2fcec46cd50eddb040b8f0e77682b2aa

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
