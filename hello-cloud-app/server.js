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
const bodyParser = require('body-parser');
const express = require('express');
const path = require('path');

// constants
const app = express();
const port = process.env.PORT ? process.env.PORT : 3000;
const region = process.env.REGION;

app.use(bodyParser.text());
// map static assets in public directory
app.use('/static', express.static('public'));

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname + '/404.html'));
});

app.get('/*', function (req, res) {
    res.sendFile(path.join(__dirname + '/index.html'));
});

app.post('/api/chat', function (req, res) {
    res.status(200).send(`<small>echo from <mark>${region}</mark></small><p>${req.body}</p>`);
});

console.log(`listening on port ${port}`);
app.listen(port);