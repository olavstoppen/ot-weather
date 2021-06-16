FROM node:14.2 as builder
# RUN apt-get install -y git
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

ENV PORT=80
ENV APP_SERVER_URL="https://ot-weather.azurewebsites.net"
EXPOSE 80

RUN [ "npm", "run", "build" ]
CMD [ "npm", "start" ]