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
// const request = require('superagent');
const Feed = require('podcast');

fs.ensureDirSync('data');
fs.ensureDirSync('public2');

// const { pageId, accessToken } = fs.readJsonSync('.env.json');

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

            if(/godarchy\.org/.test(feed.feedUrl)) {
                feed.image.url = 'https://www.godarchy.org/wp-content/uploads/2016/10/godarchy-yellow.jpg';
            }

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
                                    // const message = `"${i.title}" from ${feed.title} is now available on the MLGA Pødcast Network.`;
                                    // const link = `https://mlganetwork.com/channel/${encodeURIComponent(feed.feedUrl)}`;
                                    // request.post(`https://graph.facebook.com/${pageId}/feed?message=${encodeURIComponent(message)}&link=${encodeURIComponent(link)}&access_token=${accessToken}`)
                                    //     .then(() => resolve())
                                    //     .catch(() => resolve());
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
    .get('/audio/rss', async function(req, res) {
        try {
            const docs = await new Promise((resolve, reject) => {
                db.episodes.find({}, (err, data) => {
                    if(err) reject(err);
                    else resolve(data);
                });
            });
            const episodes = docs
                .filter(d => d.enclosure ? true : false)
                .sort((a, b) => a.isoDate === b.isoDate ? 0 : a.isoDate > b.isoDate ? -1 : 1)
                .slice(0, 40);
            const feed = new Feed({
                title: 'MLGA Pødcast Network',
                description: 'The Make Liberty Great Again (MLGA) Pødcast Network provides informative and entertaining content from passionate libertarian hosts.',
                feed_url: 'https://mlganetwork.com/rss',
                site_url: 'https://mlganetwork.com',
                image_url: 'https://mlganetwork.com/images/mlga-network.jpg',
                managingEditor: 'ryan@burgettweb.net',
                webMaster: 'ryan@burgettweb.net',
                copyright: '',
                langauge: 'en',
                categories: ['freedom', 'liberty', 'economics', 'history', 'fun'],
                pubDate: episodes[0].isoDate,
                itunesOwner: {
                    name: 'Ryan Burgett',
                    email: 'ryan@burgetweb.net'
                }
            });
            for(const episode of episodes) {
                const { itunes = {} } = episode;
                const preppedEpisode = Object.assign(
                    {},
                    omit(episode, ['feedUrl', 'itunes']),
                    Object.keys(itunes).reduce((obj, key) => {
                        obj['itunes' + key[0].toUpperCase() + key.slice(1)] = itunes[key];
                        return obj;
                    }, {})
                );
                feed.addItem(preppedEpisode);
            }
            res.set('Content-Type', 'application/rss+xml');
            res.send(feed.buildXml('  '));
        } catch(err) {
            console.error(err);
            res.sendStatus(500);
        }
    })
    .use(express.static('public'))
    .use(express.static('public2'))
    .get('/', (req, res) => {
        const indexHTML = baseIndexHTML
            .replace(/{{title}}/g, 'MLGA Network')
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
