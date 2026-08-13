FROM node:22-alpine AS build

WORKDIR /app


COPY package*.json ./


RUN npm ci --omit=dev

COPY . .


EXPOSE 5000

CMD ["npm", "start"]