FROM node:14.2 as builder
# RUN apt-get install -y git
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

ENV PORT=8000
EXPOSE 8000

CMD [ "npm", "start" ]