FROM node:14.2 as builder
# RUN apt-get install -y git
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

ENV PORT=80
EXPOSE 80

ENTRYPOINT [ "npm", "run", "build" ]
CMD [ "npm", "start" ]