FROM balena/open-balena-base:22.1.4-no-init@sha256:4e48ca6fe24a5845ef1c9ce30f3e5950e7aa6a8597d359740c8bca968affbeba

WORKDIR /usr/src/app

ENV NODE_ENV=production

COPY docker-hc ./
RUN chmod +x docker-hc

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && \
    npm cache clean --force

COPY src/ src/

CMD [ "npm", "start" ]
