FROM balena/open-balena-base:v22.0.8-no-init@sha256:1780469e1a3a7d695d81c63a0a71597ddb718d26ea4dd72828b589d81acccc3e

WORKDIR /usr/src/app

COPY docker-hc ./
RUN chmod +x docker-hc

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && \
    npm cache clean --force

COPY src/ src/

CMD [ "npm", "start" ]
