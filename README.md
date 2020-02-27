"# ratelimitservice" git init git add README.md git commit -m "first commit" git remote add origin https://github.com/jim-arbete/ratelimitservice.git git push -u origin master

1A) Start the app by using `docker-compose`:
$ docker-compose up --build
You can visit the url in browser http://127.0.0.1:4000 now.

1B) Start the app by using regular docker image:
$ docker build -t local_ratelimiterservice:latest
$ docker run local_ratelimiterservice:latest


Test the Microservice with GraphQL Playground with the following query:
- Visit http://127.0.0.1:4000 to start the Playground.
`query {
  ratelimit(ratelimitInput: {eventName: LOGIN_FAILED, ip: "10.0.0.7", email: "1aa@a.se"}) {
    ipFrom
    isRateLimited
  }
}`
[ bild på playground och queryn]

OR test with `CURL`:
curl http://localhost:4000/ -X POST -H "Content-Type: application/json" -d "{ \"query\": \"query($ip:String!, $email: String!) { ratelimit(ratelimitInput: {eventName: LOGIN_FAILED, ip: $ip, email: $email}) { ipFrom isRateLimited } }\", \"variables\": { \"ip\": \"10.0.0.1\", \"email\": \"a@a.se\" } }"

curl http://localhost:4000/ -X POST -H "Content-Type: application/json" -d "{ \"query\": \"{ serverinfo { hostIPs hostname } }\"}"


Load balance Test
- All tests are done with Docker Swarm in a local development enviroment

The following commands where used to setup our local docker swarm (use commands in a manager node):
- Make sure you have built the ratelimiter image on the local machine `$ docker-compose build` before this step
$ docker swarm init
$ docker stack deploy --compose-file docker-compose.yml swarmstack

Look at the running stack:
$ docker stack services swarmstack

Stop the test and exit your local dev machine from the docker swarm:
$ docker stack rm swarmstack
$ docker swarm leave --force
