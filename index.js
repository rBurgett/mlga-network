const bodyParser = require('body-parser');
const DataStore = require('nedb');
const express = require('express');
const favicon = require('serve-favicon');
const fs = require('fs-extra-promise');
const multipart = require('connect-multiparty');
const escape = require('lodash/escape');
const omit = require('lodash/omit');
const Parser = require('rss-parser');
const path = require('path');

fs.ensureDirSync('data');
fs.ensureDirSync('public2');

const secureUrl = (url = '') => {
    return url.replace(/^http:/, 'https:');
};

const db = {
    feeds: new DataStore({ filename: path.join(__dirname, 'data', 'feeds.db'), autoload: true }),
    episodes: new DataStore({ filename: path.join(__dirname, 'data', 'episodes.db'), autoload: true })
};

const parser = new Parser();
const feeds = fs.readJsonSync('feeds.json', 'utf8');

const updateFeeds = async function() {
    try {
        for(const feedUrl of feeds) {
            const feed = await parser.parseURL(feedUrl);
            const items = [...feed.items]
                .filter(i => i.enclosure ? true : false);
            const meta = omit(feed, ['items']);
            await new Promise((resolve, reject) => {
                db.feeds.update({ feedUrl: feed.feedUrl }, meta, { upsert: true }, err => {
                    if(err) reject(err);
                    else resolve();
                });
            });
            const promises = items.map(i => {
                return new Promise((resolve, reject) => {
                    db.episodes.findOne({ guid: i.guid }, (err, doc) => {
                        if(err) {
                            reject(err);
                        } else if(doc) {
                            resolve();
                        } else {
                            db.episodes.insert(Object.assign({}, i, {feedUrl: feed.feedUrl}), err1 => {
                                if(err1) {
                                    reject(err1);
                                } else {
                                    resolve();
                                }
                            });
                        }
                    });
                });
            });
            await Promise.all(promises);
        }
        console.log('Done updating feeds.');
    } catch(err) {
        console.error(err);
    }
};

updateFeeds();
setInterval(updateFeeds, 1800000);

const baseIndexHTML = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

const app = express()
    .use(bodyParser.json())
    .use(bodyParser.urlencoded({ extended: true }))
    .use(multipart({
        autoFiles: false
    }))
    .use(favicon('./public/favicon.ico'))
    .get('/api/feeds', (req, res) => {
        db.feeds.find({}, (err, docs) => {
            if(err) {
                console.error(err);
                res.sendStatus(500);
            } else {
                res.send(JSON.stringify(docs));
            }
        });
    })
    .get('/api/episodes', (req, res) => {
        const { q = 20, f = '' } = req.query;
        const query = {};
        if(f) query.feedUrl = decodeURIComponent(f);
        db.episodes.find(query, (err, docs) => {
            if(err) {
                console.error(err);
                res.sendStatus(500);
            } else {
                const preppedDocs = docs
                    .filter(d => d.enclosure ? true : false)
                    .sort((a, b) => a.isoDate === b.isoDate ? 0 : a.isoDate > b.isoDate ? -1 : 1)
                    .slice(0, q);
                res.send(JSON.stringify(preppedDocs));
            }
        });
    })
    .use(express.static('public'))
    .use(express.static('public2'))
    .get('/', (req, res) => {
        const indexHTML = baseIndexHTML
            .replace(/{{title}}/g, 'MLGA Network"')
            .replace(/{{description}}/g, 'The Make Liberty Great Again (MLGA) Pødcast Network provides informative and entertaining content from passionate libertarian hosts.')
            .replace(/{{image}}/g, 'https://mlganetwork.com/images/mlga-network.jpg')
            .replace(/{{imageWidth}}/g, '1024')
            .replace(/{{imageHeight}}/g, '1024')
            .replace(/{{uri}}/g, '');
        res.send(indexHTML);
    })
    .get('/channel/:feedUrl', (req, res) => {
        const { feedUrl } = req.params;
        db.feeds.findOne({ feedUrl }, (err, feed) => {
            if(err) {
                console.error(err);
                res.sendStatus(500);
            } else if(!feed) {
                res.sendStatus(404);
            } else {
                const indexHTML = baseIndexHTML
                    .replace(/{{title}}/g, escape(feed.title))
                    .replace(/{{description}}/g, escape(`Listen to ${feed.title} on the MLGA Pødcast Network.`))
                    .replace(/{{image}}/g, secureUrl(feed.image.url))
                    .replace(/{{imageWidth}}/g, '')
                    .replace(/{{imageHeight}}/g, '')
                    .replace(/{{uri}}/g, `/channel/${encodeURIComponent(feedUrl)}`);
                res.send(indexHTML);
            }
        });
    })
    .get('*', (req, res) => {
        res.sendStatus(404);
    });

const port = process.env.PORT || 3500;

const server = app.listen(port, () => {
    console.log('App listening at port', server.address().port);
});
