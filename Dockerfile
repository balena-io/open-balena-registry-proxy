FROM balena/open-balena-base:22.0.6-no-init@sha256:2e945415798c8d467c2f181a099394056d055d97b7a01f2a9724ad129678154b

WORKDIR /usr/src/app

COPY docker-hc ./
RUN chmod +x docker-hc

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && \
    npm cache clean --force

COPY src/ src/

CMD [ "npm", "start" ]
