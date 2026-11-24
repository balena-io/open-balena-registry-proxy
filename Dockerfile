FROM balena/open-balena-base:22.2.3-no-init@sha256:c2abb1d6feaec301464002e3f069e2f8029b3be59df72f3629a8a8c81432b541

WORKDIR /usr/src/app

ENV NODE_ENV=production

COPY docker-hc ./
RUN chmod +x docker-hc

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && \
    npm cache clean --force

COPY src/ src/

CMD [ "npm", "start" ]
