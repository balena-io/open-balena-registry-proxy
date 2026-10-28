FROM balena/open-balena-base:v22.0.7-no-init@sha256:75c607e40071d704c967d74791d367c10cff143d7531f63bb7dd66ff80e8ff2e

WORKDIR /usr/src/app

COPY docker-hc ./
RUN chmod +x docker-hc

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && \
    npm cache clean --force

COPY src/ src/

CMD [ "npm", "start" ]
