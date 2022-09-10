FROM node:16.15.1
WORKDIR /home/trab-1-prog-distr
COPY . .
RUN npm install
ENV IS_CONTAINER=true
CMD ["npm", "run", "start-inside-container"]
