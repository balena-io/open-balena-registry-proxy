FROM balena/open-balena-base:21.0.26-no-init@sha256:1a0b2ee6ad43ba3dcffe06bab6e1afb402d9ddffbe9740a18250fadbe7111040

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
