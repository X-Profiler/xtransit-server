FROM node:12.18.0-alpine as build

WORKDIR /app

COPY . .

ENV NODE_ENV prod

RUN npm config set registry https://registry.npmmirror.com && npm install --prod

EXPOSE 9090

CMD [ "node", "dispatch.js" ]
