const express = require('express');
const request = require('superagent');
const Parser = require('rss-parser');
const fs = require('fs-extra-promise');

const parser = new Parser();

const port = 3500;

express()
    .get('/', (req, res) => {
        res.send(`Go to http://localhost:${port}/status/[status code] to get any status code`);
    })
    .get('/status/301', (req, res) => {
        res.redirect(301, `http://localhost:${port}/destination`);
    })
    .get('/status/:status', (req, res) => {
        const { status } = req.params;
        res.sendStatus(Number(status));
    })
    .get('/destination', async function(req, res) {
        const feed = await fs.readFileAsync('sample.xml', 'utf8');
        res.send(feed);
    })
    .listen(port, async function() {
        console.log(`Status Test Server Running on port ${port}.`);
        try {
            const res = await request.get(`http://localhost:${port}/status/301`);
            const { redirects, text } = res;
            console.log(redirects);
            const data = await parser.parseString(text);
            console.log(data);
        } catch(err) {
            console.error(err);
        }
    });
