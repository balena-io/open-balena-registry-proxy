FROM balena/open-balena-base:21.0.27-no-init@sha256:c7cef3d638fe62a7f9c698eda5627aeb47965e7b7978daa88d88791d535e73aa

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
