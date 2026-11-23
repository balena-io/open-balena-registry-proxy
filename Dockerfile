FROM balena/open-balena-base:22.2.0-no-init@sha256:cdaa7146aa0b7662e8061b71db0c367efad6ee251c577b24b51d459af2386fa7

WORKDIR /usr/src/app

ENV NODE_ENV=production

COPY docker-hc ./
RUN chmod +x docker-hc

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && \
    npm cache clean --force

COPY src/ src/

CMD [ "npm", "start" ]
