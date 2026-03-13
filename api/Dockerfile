FROM node:20-alpine

WORKDIR /data/app

COPY package*.json ./

RUN npm ci --omit=dev

COPY . .

EXPOSE 3000

CMD ["node", "bin/www"]