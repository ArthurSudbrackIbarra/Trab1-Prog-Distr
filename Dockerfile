FROM node:16.15.1
WORKDIR /home/trab-1-prog-distr
COPY . .
RUN npm install
CMD ["npm", "run", "start-with-docker"]
