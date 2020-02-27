# Ratelimiter Microservice - Using GraphQL API and Redis

## Installation Prerequisites
1. Install Node.js version 12 or later `https://nodejs.org/en/download/`. 
2. Install Docker `https://docs.docker.com/get-started/`. 

## Installation

```bash
$ git clone https://github.com/jim-arbete/ratelimitservice.git ratelimitservice
$ cd ratelimitservice
$ npm install
```

### `npm run dev`

Runs the app in the development mode.<br>
Open [http://localhost:4000](http://localhost:4000) to view it in the browser.

The page will reload if you make edits.<br>
You will also see any lint errors in the console.

### `npm run build`

Run `npm run build` to build the project. The build artifacts will be stored in the `dist/` directory.

### `npm start`

Run `npm start` to the project in production mode on your local machine. 


## Development with Docker
### 1A) Start the app stack by using `docker-compose`:
```bash
$ docker-compose up --build
```
You can visit the url in browser http://localhost:4000 now.

### 1B) Start the app stack by using regular docker image:
```bash
$ docker build -t local_ratelimiterservice:latest
$ docker run local_ratelimiterservice:latest
$ docker run redis:latest
```

### Test the Microservice with GraphQL Playground with the following query:
- Visit http://127.0.0.1:4000 to start the Playground and run the following query:
```bash
query {
  ratelimit(ratelimitInput: {eventName: LOGIN_FAILED, ip: "10.0.0.2", email: "test@test.se"}) {
    ipFrom
    isRateLimited
  }
}
```

OR test with `CURL`:
```bash
curl http://localhost:4000/ -X POST -H "Content-Type: application/json" -d "{ \"query\": \"query($ip:String!, $email: String!) { ratelimit(ratelimitInput: {eventName: LOGIN_FAILED, ip: $ip, email: $email}) { ipFrom isRateLimited } }\", \"variables\": { \"ip\": \"10.0.0.1\", \"email\": \"a@a.se\" } }"
```

```bash
curl http://localhost:4000/ -X POST -H "Content-Type: application/json" -d "{ \"query\": \"{ serverinfo { hostIPs hostname } }\"}"
```

## Load Balance - Test setup
- All tests are done with Docker Swarm in a local development enviroment

The following commands where used to setup our local docker swarm (use commands in a manager node):
- Make sure you have built the ratelimiter image on the local machine `$ docker-compose build` before this step
```bash
$ docker swarm init
$ docker stack deploy --compose-file docker-compose.yml swarmstack
```

Look at the running stack and performance:
```bash
$ docker stack services swarmstack
$ docker stats
```

Stop the test and exit your local dev machine from the docker swarm:
```bash
$ docker stack rm swarmstack
$ docker swarm leave --force
```

## Benchmarks setup
- Load balance testing is done with `Artillery.io` nodejs package
- Performance profiling in nodejs is done with the package: `https://github.com/davidmarkclements/0x`
```bash
$ npm install -g artillery
$ artillery quick --count 10 -n 20 http://localhost:4000/
$ artillery run benchmarks\artillery.yml
$ artillery run -o report.json artillery.yml
$ artillery report report.json
```

# Benchmarks report
- Artillery is setup to perform 4000 requests (simulatig 400 requests per second over a period of 10 seconds).

## 1A) Testing with 1 instance of our microservice

```bash
$ docker service scale swarmstack_ratelimiter-service=1
```

### Summary report @ 22:33:48(+0100) 2020-02-27    
```bash       
Scenarios launched:  4000                           
Scenarios completed: 4000                           
Requests completed:  4000                           
RPS sent: 127.47                                    
Request latency:                                    
  min: 30.3                                         
  max: 16792.9                                      
  median: 13728.2                                   
  p95: 16480.4                                      
  p99: 16737.3                                      
Scenario counts:                                    
  GraphQL microservice load test: 4000 (100%)       
Codes:                                              
  200: 4000                                         
```
## 1B) Testing with 4 instances of our microservice

```bash
$ docker service scale swarmstack_ratelimiter-service=4
```

### Summary report @ 22:34:43(+0100) 2020-02-27
```bash
Scenarios launched:  4000
Scenarios completed: 4000
Requests completed:  4000
RPS sent: 186.31
Request latency:
  min: 11.5
  max: 970.9
  median: 92.2
  p95: 428.4
  p99: 638.7
Scenario counts:
  GraphQL microservice load test: 4000 (100%)
Codes:
  200: 4000
```

## 2) Comparing results
```bash
          (1 service) vs  (4 services)
- min:    30.3ms    vs  11.5ms
- max:    16792.9ms vs  970.9ms
- median: 13728.2ms vs  92.2ms
- p95:    16480.4ms vs  428.4ms
- p99:    16737.3ms vs  638.7ms
```

p95 and p99 are the important ones to compare, the 4 services can handle the load better clearly going by the result. 99% of the 4000 requests complete in much shorter time than if we were using a single-process.

## 3) Profiling Node processes

```bash
$ npm install -g 0x
$ 0x dist/main.js
```
Open the generated `flamegraph.html` to analyze the report


A quick analysis of the flamegraph show that ratelimiter.service.ts is the part we can start to improve and optimize before trying another soloution like a rest api with expressJS instead of graphql or another language.

The methods `isRequestBannable` and `setStateBannedIPs` are accounting for 27,2% of the total calls and `setStateBannedIPs` is just a small IO-wrapper to redis. Since nodejs handles really IO heavy task well, especially IO calls like redis, databases and request/response IO, we can improve blocking the event loop by using more asynchronous programming for IO-heavy stuff. 

 ## External test benchmarks
 For nodejs with express rest api and graphql api, to get a feel how nodejs will perform as a microservice.
`https://github.com/benawad/node-graphql-benchmarks`