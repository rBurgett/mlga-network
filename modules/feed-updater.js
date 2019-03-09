const Parser = require('rss-parser');
const { omit } = require('lodash');
const { makeSlug } = require('./util');

const parser = new Parser();

class FeedUpdater {

    constructor({ feeds, db }) {
        this._feeds = feeds;
        this._db = db;
    }

    async update() {
        const { _feeds: feeds, _db: db } = this;
        for(const feedUrl of feeds) {
            const feed = await parser.parseURL(feedUrl);
            const items = [...feed.items]
                .filter(i => i.enclosure ? true : false);
            const meta = omit(feed, ['items']);

            if(/godarchy\.org/.test(feed.feedUrl)) {
                feed.image.url = 'https://www.godarchy.org/wp-content/uploads/2016/10/godarchy-yellow.jpg';
            }

            const slug = await new Promise((resolve, reject) => {
                db.feeds.findOne({ feedUrl: feed.feedUrl }, (err, res) => {
                    if(err) reject(err);
                    else resolve(res && res.slug ? res.slug : makeSlug(feed.title));
                });
            });

            meta.slug = slug;

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
                            if(doc.slug) {
                                resolve();
                            } else {
                                db.episodes.update({ guid: i.guid }, Object.assign({}, doc, {slug}), err1 => {
                                    if(err1) reject(err1);
                                    else resolve();
                                });
                            }
                        } else {
                            db.episodes.insert(Object.assign({}, i, {slug, feedUrl: feed.feedUrl}), err1 => {
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
    }

}

module.exports = FeedUpdater;
