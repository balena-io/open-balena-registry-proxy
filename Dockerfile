FROM balena/open-balena-base:22.1.2-no-init@sha256:c0ae5531a0714ab1dc1e56322c69285bf1a00ba276000f3621664d56669d0fb8

WORKDIR /usr/src/app

ENV NODE_ENV=production

COPY docker-hc ./
RUN chmod +x docker-hc

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && \
    npm cache clean --force

COPY src/ src/

CMD [ "npm", "start" ]
