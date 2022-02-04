FROM balena/open-balena-base:v13.0.5 as runtime

WORKDIR /usr/src/app

COPY *.json ./
COPY src/ src/
COPY tests/ tests/

RUN npm ci --ignore-scripts && \
    npm run build && \
    npm run test && \
    npm prune --production && \
    npm cache clean --force

CMD [ "npm", "start" ]
