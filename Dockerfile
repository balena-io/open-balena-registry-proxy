FROM balena/open-balena-base:21.0.34-no-init@sha256:4475718dcaa8cc3980a5de59f7694da4dd996cad0a66b79c818f6025e96a5174

WORKDIR /usr/src/app

COPY docker-hc ./
RUN chmod +x docker-hc

COPY *.json ./
COPY src/ src/

RUN npm ci --ignore-scripts && \
    npm run build && \
    npm prune --omit=dev && \
    npm cache clean --force

CMD [ "npm", "start" ]
