"# ratelimitservice" git init git add README.md git commit -m "first commit" git remote add origin https://github.com/jim-arbete/ratelimitservice.git git push -u origin master

Start the app by using docker composer:
docker-compose up --build
You can visit the url in browser http://127.0.0.1:7001 now.

Start the app by using docker image:
docker build -t asia.gcr.io/web-campaign/api-server:0.2 .
docker run asia.gcr.io/web-campaign/api-server:0.2
