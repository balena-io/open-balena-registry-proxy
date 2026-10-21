FROM balena/open-balena-base:22.0.5-no-init@sha256:4de24f79bf990e80af22689a4f23cfdda4203696a2c88243f33958b29c65e7fd

WORKDIR /usr/src/app

COPY docker-hc ./
RUN chmod +x docker-hc

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && \
    npm cache clean --force

COPY src/ src/

CMD [ "npm", "start" ]
