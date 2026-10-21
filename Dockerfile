FROM balena/open-balena-base:22.0.4-no-init@sha256:e3ad05707a7108367611f466bc005f70a88639dc14d10b8155ff9042a22b8fa3

WORKDIR /usr/src/app

COPY docker-hc ./
RUN chmod +x docker-hc

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && \
    npm cache clean --force

COPY src/ src/

CMD [ "npm", "start" ]
