FROM balena/open-balena-base:v22.0.3-no-init@sha256:9f65a88b226d964cea7f523b033f9fea15bf30e9c8601903994acccf2e45f1f4

WORKDIR /usr/src/app

COPY docker-hc ./
RUN chmod +x docker-hc

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && \
    npm cache clean --force

COPY src/ src/

CMD [ "npm", "start" ]
