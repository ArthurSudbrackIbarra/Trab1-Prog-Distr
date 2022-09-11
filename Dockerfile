FROM node:16.15.1
ENV IS_CONTAINER=true
WORKDIR /home/trab-1-prog-distr
COPY . .
RUN npm install