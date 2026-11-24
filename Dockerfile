FROM balena/open-balena-base:22.2.2-no-init@sha256:53f6297a6309e46643a1cad61431ab9c8263db60a4c394c15c420f210d5bb223

WORKDIR /usr/src/app

ENV NODE_ENV=production

COPY docker-hc ./
RUN chmod +x docker-hc

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && \
    npm cache clean --force

COPY src/ src/

CMD [ "npm", "start" ]
