FROM adorsys/node:10

#COPY . .
# or
COPY package.json /src/package.json
COPY package-lock.json /src/package-lock.json
COPY server.js /src/server.js
WORKDIR /src
RUN npm ci

EXPOSE 3000

#CMD [ "npm", "run", "start:dev" ]
# or
CMD ["npm", "run", "start"]
