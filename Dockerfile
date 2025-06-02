FROM node:18-alpine

USER node

WORKDIR /app

COPY package*.json ./

RUN npm clean-install

COPY . ./app

EXPOSE $APP_PORT