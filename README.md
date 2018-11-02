# hello-cloud
_hello world_ example for Multicloud applications

### Demo

#### Start the stack
```
docker-compose -f docker-compose.yml build
docker-compose -f docker-compose.yml up
```

UI served via
Global Load Balancer -> Regional Load Balancer [Linkerd](https://linkerd.io/) -> Region Compute (node.js)

Access _live_ version of the app
http://localhost:9000

Oh no! A 404 page.

Let's add a Route using [traffic-director](https://github.com/homeaway/traffic-director):

```
curl -X POST \
  http://localhost:8080/api/v1/routes \
  -H 'Accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{"path":"/cloud","upstream":{"locator":{"service":"hello-cloud-app"}}}'
```

Verify that Route was added to [traffic-director](https://github.com/homeaway/traffic-director). In this reference implementation load balancers can poll a simple microservice for updates to the routing data:
http://localhost:8080/api/v1/routes/entries

``` js
[
    {
        "path": "/cloud", // "vanilla" URL path that maps to any host
        "uri": "/hello-cloud-app" // Service Discovery path for a Consul service in any available region
    },
    {
        "path": "www.homeaway.com/hello", // host and path mapping to support different hosts
        "uri": "/hello-cloud-app" //
    },
    {
        "path": "/cloud/v/ce6836c6-7ca5-4944-8285-647aa9ae39b6", // variant defined as part of the routable path
        "uri": "/live/hello-cloud-app" // Service Discovery path for a Consul tag and service in any available region
    },
    {
        "path": "/cloud/f/84f88ddb-1ceb-4d52-b51a-66ff18d84191", // fallback defined as part of the routable path
        "uri": "/fallback/hello-cloud-app" // Service Discovery path for a Consul tag and service in any available region
    }
]
```

Refresh the Global Load Balancer
http://localhost:9000/?refresh=true

Access a mapped path
http://localhost:9000/cloud

Service Registry [Consul](https://www.consul.io/) UI
http://localhost:8500/ui/dc1/services

Service Mesh [Linkerd](https://linkerd.io/) UI
http://localhost:9990/delegator?router=%2Fhttp-consul#%2Fsvc%2Fhello-cloud-service

Service Metrics [Prometheus](https://prometheus.io/) UI
http://localhost:9090/graph?g0.range_input=1h&g0.expr=rt%3Aclient%3Astatus%3A2XX&g0.tab=0

# License

[LICENSE](LICENSE)
