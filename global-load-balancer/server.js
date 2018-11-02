/*
 * Copyright 2018 Expedia, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// imports
const cacheProvider = require('./cache-provider');
const http = require('http');
const httpProxy = require('http-proxy');
const request = require('request');
const url = require('url');

// constants
const directorHost = process.env.DIRECTOR_HOST ? process.env.DIRECTOR_HOST : 'http://director:8080';
const proxy = httpProxy.createProxyServer({});
const port = process.env.PORT ? process.env.PORT : 3000;
const ttl = 60; // cache for 1 Minute

// variables
let routes = [];
let target = 'http://linkerd:4140';

function getCacheable(path, callback) {

    cacheProvider.instance().get(path, function (err, value) {
        if (err) console.error(err);
        if (value == undefined) {
            request.get(path, function (err, response, body) {
                let result = JSON.parse(body);

                cacheProvider.instance().set(path, result, ttl, function (err, success) {
                    if (!err && success) {
                        callback(result);
                    }
                });
            });
        } else {
            callback(value);
        }
    });

}

function updateTarget() {
    getCacheable(`${directorHost}/api/v1/regions`, function (regions) {
        target = regions[0].uri;
    });
}


function updateRouteEntries() {
    getCacheable(`${directorHost}/api/v1/routes/entries`, function (entries) {
        console.log(entries);
        routes = entries;
    });
}

// To modify the proxy connection before data is sent, you can listen
// for the 'proxyReq' event. When the event is fired, you will receive
// the following arguments:
// (http.ClientRequest proxyReq, http.IncomingMessage req,
//  http.ServerResponse res, Object options). This mechanism is useful when
// you need to modify the proxy request before the proxy connection
// is made to the target.
//
proxy.on('proxyReq', function (proxyReq, req, res, options) {
    try {
        let path = url.parse(req.url).pathname;
        for (var route of routes) {
            if (path.startsWith(route.path)) {
                console.log(`path: ${path} matched uri: ${route.uri}`);
                proxyReq.setHeader("X-Upstream-Service", route.uri);
            }
        }

    } catch (err) {
        console.log(err);
    }
});

//
// Create your custom server and just call `proxy.web()` to proxy
// a web request to the target passed in the options
// also you can use `proxy.ws()` to proxy a websockets request
//
let server = http.createServer(function (req, res) {
    try {
        let urlObject = url.parse(req.url, true);
        if (urlObject.query && urlObject.query.refresh) {
            updateRouteEntries();
            updateTarget();
            res.writeHead(202, { 'Content-Type': 'text/plain' });
            res.end('accepted');
        } else {
            let options = {
                target: target
            };
            proxy.web(req, res, options);
        }
    } catch (err) {
        console.log(err);
    }
});

// start Cache provider
cacheProvider.start(function (err) {
    if (err) console.error(err);
});

console.log(`listening on port ${port}`);
server.listen(port);