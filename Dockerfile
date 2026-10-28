FROM balena/open-balena-base:22.0.9-no-init@sha256:f4ed07d68fed8e32274377572794c34a26ffc4bc8774a7edc7bec22d9d1b6b6a

WORKDIR /usr/src/app

COPY docker-hc ./
RUN chmod +x docker-hc

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && \
    npm cache clean --force

COPY src/ src/

CMD [ "npm", "start" ]
