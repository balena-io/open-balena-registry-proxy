FROM balena/open-balena-base:v22.1.3-no-init@sha256:d936ebd674f70b6208d994c74046482e5241c3a43d21dde5aba03184f3384c2b

WORKDIR /usr/src/app

ENV NODE_ENV=production

COPY docker-hc ./
RUN chmod +x docker-hc

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && \
    npm cache clean --force

COPY src/ src/

CMD [ "npm", "start" ]
