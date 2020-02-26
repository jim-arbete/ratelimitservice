FROM node:12-alpine

ENV TZ=Europe/Stockholm

RUN apk --update add tzdata \
  && cp /usr/share/zoneinfo/$TZ /etc/localtime \
  && echo $TZ > /etc/timezone

WORKDIR /usr/src/app

# Only copy the package.json file to work directory
COPY package.json .
# Install all Packages
RUN npm install

# Copy all other source code to work directory
ADD . /usr/src/app
# TypeScript => build with tsc
RUN npm run build

# Start
CMD [ "npm", "start" ]
EXPOSE 4000

