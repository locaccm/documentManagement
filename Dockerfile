FROM node:20-alpine

ARG DATABASE_URL

ENV DATABASE_URL=${DATABASE_URL}

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY .gitmodules ./
COPY . .

RUN git submodule update --init --recursive

RUN npm run migrate
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]