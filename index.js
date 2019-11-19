const bodyParser = require('body-parser');
const DataStore = require('nedb');
const express = require('express');
const session = require('express-session');
const NedbStore = require('express-nedb-session')(session);
const passport = require('passport');
const { Strategy } = require('passport-local');
const { ensureLoggedIn } = require('connect-ensure-login');
const favicon = require('serve-favicon');
const fs = require('fs-extra-promise');
const multipart = require('connect-multiparty');
const escape = require('lodash/escape');
const omit = require('lodash/omit');
const path = require('path');
const Feed = require('podcast');
const { pbkdf2, generateSalt, secureUrl } = require('./modules/util');
const ErrorHandler = require('./modules/handle-error');
const FeedUpdater = require('./modules/feed-updater');
const s3 = require('s3');
// const d3 = require('d3-time-format');
// const dynogels = require('dynogels-promisified');
// const Joi = require('joi');
const rmrf = require('rmrf-promise');
const decompress = require('decompress');
const decompressGz = require('decompress-gz');
const moment = require('moment');

class ServerLog {
    constructor({ _id, host, date, time, isoDate, ip, method, uri }) {
        this._id = _id;
        this.host = host;
        this.date = date;
        this.isoDate = isoDate;
        this.time = time;
        this.ip = ip;
        this.method = method;
        this.uri = uri;
    }
}

// const ServerLogModel = dynogels.define('ServerLog', {
//     tableName: 'MLGANetworkServerLog',
//     hashKey: 'bucket',
//     rangeKey: 'time',
//     timestamps: false,
//     schema: {
//         _id: Joi.string(),
//         bucket: Joi.string(),
//         time: Joi.string(),
//         requester: Joi.string(),
//         operation: Joi.string(),
//         key: Joi.string()
//     }
// });

// ServerLogModel.scan().loadAll().execAsync()
//     .then(({ Items }) => {
//         return Promise.all(Items.map(model => model.destroyAsync()));
//     })
//     .then(() => {
//         console.log('All logs deleted.');
//     })
//     .catch(console.error);

const tempDir = path.join(__dirname, 'temp');
fs.ensureDirSync(tempDir);

const Bucket = 'cdnlogs.mlganetwork.com';

const s3Client = s3.createClient();

// const parseLog = (log = '') => {
//     const parseTime = d3.timeParse('[%d/%b/%Y:%H:%M:%S %Z]');
//     // const logPatt = /^\w+?\s(\[.+?])\s(\d+?\.\d+?\.\d+?\.\d+?)\s(\w+?)\s(\w+?)\s(.+?)\s/;
//     const logPatt = /^\w+?\s(.+?)\s(\[.+?])\s(\d+?\.\d+?\.\d+?\.\d+?)\s\w+?\s(\w+?)\s\w+?\.(\w+?)\.\w+?\s.+?(\/\S*?)[\s?]/;
//     const split = log
//         .split('\n')
//         .map(s => s.trim())
//         .filter(s => s)
//         .map(l => {
//             const matches = l.match(logPatt);
//             if(matches) return new ServerLog({
//                 _id: matches[4],
//                 host: matches[1],
//                 time: parseTime(matches[2]).toISOString(),
//                 ip: matches[3],
//                 method: matches[5],
//                 uri: matches[6]
//             });
//             else return null;
//         })
//         .filter(s => s);
//     return split;
// };

const getKeys = () => new Promise((resolve, reject) => {
    const options = {
        s3Params: {
            Bucket,
            MaxKeys: 1000
        }
    };
    const stream = s3Client.listObjects(options);
    let keys = [];
    stream.on('data', data => keys = keys.concat(data.Contents.map(c => c.Key)));
    stream.on('end', () => resolve(keys));
    stream.on('error', reject);
});
const downloadFile = Key => new Promise((resolve, reject) => {
    const filePath = path.join(tempDir, Key);
    const options = {
        localFile: filePath,
        s3Params: {
            Bucket,
            Key
        }
    };
    const stream = s3Client.downloadFile(options);
    stream.on('end', () => resolve(filePath));
    stream.on('error', reject);
});
// const downloadFileContents = Key => new Promise((resolve, reject) => {
//     const options = {
//         Bucket,
//         Key
//     };
//     const stream = s3Client.downloadBuffer(options);
//     stream.on('end', res => resolve(res.toString()));
//     stream.on('error', reject);
// });

(async function() {
    try {

        await rmrf(tempDir);

        let keys = await getKeys();
        keys = keys.slice(0, 100);

        for(let i = 0; i < keys.length; i++) {
            console.log(`${i + 1} of ${keys.length} - ${keys[i]}`);
            await downloadFile(keys[i]);
        }
        let folders = await fs.readdirAsync(tempDir);
        folders = folders
            .filter(f => fs.statSync(path.join(tempDir, f)).isDirectory())
            .map(f => path.join(tempDir, f));

        const tempDir2 = path.join(__dirname, 'temp2');

        for(let i = 0; i < folders.length; i++) {
            const folder = folders[i];

            const files = await fs.readdirAsync(folder);

            for(let j = 0; j < files.length; j++) {
                const file = path.join(folder, files[j]);
                await decompress(file, tempDir2, {
                    inputFile: file,
                    plugins: [
                        decompressGz()
                    ]
                });
            }

        }

        {
            let allData = [];

            const files = await fs.readdirAsync(tempDir2);

            for(const file of files) {
                const filePath = path.join(tempDir2, file);
                const contents = await fs.readFileAsync(filePath, 'utf8');
                const split = contents
                    .split('\n')
                    .map(s => s.trim())
                    .filter(s => s);
                const fields = split[1]
                    .replace(/^#Fields:\s/, '')
                    .split(/\s+/);
                const data = split
                    .slice(2)
                    .map(s => s
                        .split(/\s+/)
                        .reduce((obj, ss, k) => {
                            const field = fields[k];
                            return {
                                ...obj,
                                [field]: ss
                            };
                        }, {})
                    )
                    .map(obj => {
                        const { date, time } = obj;
                        const dateObj = moment(`${date} ${time} +0000`, 'YYYY-MM-DD HH:mm:ss Z').toDate();
                        return new ServerLog({
                            _id: obj['x-edge-request-id'],
                            host: obj['x-host-header'],
                            date,
                            time,
                            isoDate: dateObj.toISOString(),
                            ip: obj['c-ip'],
                            method: obj['cs-method'],
                            uri: obj['cs-uri-stem']
                        });
                    })
                    .filter(log => {
                        return [
                            /^\/$/,
                            /^\/audio\//,
                            /^\/\d+/
                        ].some(patt => patt.test(log.uri));
                    });
                allData = [...allData, data];
            }

            await fs.writeJsonAsync('logs.json', allData);

        }


        // const contentsArr = await Promise.all(keys
        //     .map(key => downloadFileContents(key))
        // );
        // const logs = contentsArr
        //     .map(log => parseLog(log))
        //     .reduce((arr, a) => arr.concat(a), [])
        //     // .filter(l => l.operation === 'GET');
        // for(const log of logs) {
        //     if(/\.mp3$/.test(log.key)) console.log(log);
        // }
        // for(let i = 0; i < logs.length; i++) {
        //     console.log(`${i + 1} of ${logs.length}`);
        //     await ServerLogModel.createAsync(logs[i]);
        // }
        // console.log('end', logs.length);
        // const { Items: models } = await ServerLogModel
            // .query('voluntaryvixens.com')
            // .scan()
            // .loadAll()
            // .execAsync();
        // const filtered = models
        //     .map(m => new ServerLog(m.attrs))
        //     .filter(l => /\.mp3$/.test(l.key));
        // console.log('length', filtered.length);

        console.log('Done!');

    } catch(err) {
        console.error(err);
    }
})();

fs.ensureDirSync('public2');

/************************************************
 * Set Constants
 ************************************************/
const saltLength = 16;
const userTypes = {
    admin: 'admin',
    user: 'user'
};
const dataPath = path.join(__dirname, 'data');

/************************************************
 * Load Environmental Variables
 ************************************************/
const { SESSION_SECRET, MAILGUN_KEY, MAILGUN_DOMAIN } = process.env;
if(!SESSION_SECRET) throw new Error('You must have a SESSION_SECRET environmental variable set.');
if(!MAILGUN_KEY) throw new Error('You must have a MAILGUN_KEY environmental variable set.');
if(!MAILGUN_DOMAIN) throw new Error('You must have a MAILGUN_DOMAIN environmental variable set.');

/************************************************
 * Configure Mailgun
 ************************************************/
const mailgun = require('mailgun-js')({
    apiKey: MAILGUN_KEY,
    domain: MAILGUN_DOMAIN
});

/************************************************
 * Initialize Error Handler
 ************************************************/
const errorHandler = new ErrorHandler({ mailgun });
const handleError = err => errorHandler.handle(err);

/************************************************
 * Database Initialization
 ************************************************/
fs.ensureDirSync('data');
const db = {
    feeds: new DataStore({ filename: path.join(dataPath, 'feeds.db'), autoload: true }),
    episodes: new DataStore({ filename: path.join(dataPath, 'episodes.db'), autoload: true }),
    users: new DataStore({ filename: path.join(dataPath, 'users.db'), autoload: true })
};

/************************************************
 * Load and Update Feeds
 ************************************************/
const feeds = fs.readJsonSync('feeds.json', 'utf8');

const feedUpdater = new FeedUpdater({ feeds, db });

// feedUpdater.update().catch(handleError);
// setInterval(() => {
//     feedUpdater.update().catch(handleError);
// }, 1800000);

/************************************************
 * User Accounts Setup
 ************************************************/
db.users.findOne({username: 'ryan@burgettweb.net'}, (err, doc) => {
    if(err) {
        handleError(err);
    } else if(!doc) {
        const password = 'adminpass';
        const salt = generateSalt(saltLength);
        const hashedPassword = pbkdf2(password, salt);
        db.users.insert({
            username: 'ryan@burgettweb.net',
            password: hashedPassword,
            salt,
            type: userTypes.admin
        });
    }
});

passport.use(new Strategy((username, password, callback) => {
    db.users.findOne({ username }, (err, doc) => {
        if(err) return callback(err);
        if(!doc) return callback(null, false);
        const { salt } = doc;
        const hashedPassword = pbkdf2(password, salt);
        if(hashedPassword !== doc.password) return callback(null, false);
        callback(null, doc);
    });
}));
passport.serializeUser((user, callback) => {
    callback(null, user._id);
});
passport.deserializeUser((_id, callback) => {
    db.users.findOne({ _id }, (err, user) => {
        if(err) callback(err);
        else callback(null, user);
    });
});

/************************************************
 * Load HTML Files
 ************************************************/
const baseIndexHTML = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const adminHTML = fs.readFileSync('admin.html', 'utf8');

/************************************************
 * Create Server
 ************************************************/
const app = express()
    .use(bodyParser.json())
    .use(bodyParser.urlencoded({ extended: true }))
    .use(multipart({
        autoFiles: false
    }))
    .use(session({
        secret: SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        store: new NedbStore({ filename: path.join(dataPath, 'session.db') })
    }))
    .use(passport.initialize())
    .use(passport.session())
    .use(favicon('./public/favicon.ico'))
    .get('/login', async function(req, res) {
        const loginHTML = await fs.readFileAsync('login.html', 'utf8');
        res.send(loginHTML);
    })
    .post('/login',
        passport.authenticate('local', { failureRedirect: '/login' }),
        (req, res) => {
            if(req.user.type === 'admin') {
                res.redirect('/admin');
            } else {
                res.redirect('/profile');
            }
        })
    .get('/logout', (req, res) => {
        req.logout();
        res.redirect('/');
    })
    .get('/admin',
        ensureLoggedIn('/login'),
        async function(req, res) {
            res.send(adminHTML);
        })
    .get('/api/feeds', (req, res) => {
        db.feeds.find({}, (err, docs) => {
            if(err) {
                handleError(err);
                res.sendStatus(500);
            } else {
                res.send(JSON.stringify(docs));
            }
        });
    })
    .get('/api/episodes', (req, res) => {
        const { q = 20, f = '' } = req.query;
        const query = {};
        if(f) query.slug = f;
        db.episodes.find(query, (err, docs) => {
            if(err) {
                handleError(err);
                res.sendStatus(500);
            } else {
                const preppedDocs = docs
                    .filter(d => d.enclosure ? true : false)
                    .sort((a, b) => a.isoDate === b.isoDate ? 0 : a.isoDate > b.isoDate ? -1 : 1)
                    .slice(0, Number(q));
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
                feed_url: 'https://mlganetwork.com/audio/rss',
                site_url: 'https://mlganetwork.com',
                image_url: 'https://mlganetwork.com/images/mlga-network-1400.jpg',
                managingEditor: 'ryan@burgettweb.net (Ryan Burgett)',
                webMaster: 'ryan@burgettweb.net (Ryan Burgett)',
                copyright: '',
                language: 'en',
                categories: ['freedom', 'liberty', 'economics', 'history', 'fun'],
                pubDate: episodes[0].isoDate,
                itunesAuthor: 'Ryan Burgett',
                itunesEmail: 'ryan@burgettweb.net',
                itunesOwner: {
                    name: 'Ryan Burgett',
                    email: 'ryan@burgetweb.net'
                },
                itunesCategory: [
                    {text: 'News & Politics'},
                    {text: 'Government & Organizations'},
                    {text: 'Society & Culture'}
                ],
                itunesImage: 'https://mlganetwork.com/images/mlga-network-1400.jpg',
                itunesExplicit: true
            });
            for(const episode of episodes) {
                const { itunes = {} } = episode;
                const preppedEpisode = Object.assign(
                    {},
                    omit(episode, ['feedUrl', 'itunes']),
                    Object.keys(itunes).reduce((obj, key) => {
                        obj['itunes' + key[0].toUpperCase() + key.slice(1)] = itunes[key];
                        return obj;
                    }, {}),
                    {date: episode.pubDate}
                );
                feed.addItem(preppedEpisode);
            }
            res.set('Content-Type', 'application/rss+xml');
            res.send(feed.buildXml('  '));
        } catch(err) {
            handleError(err);
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
    .get('/about', (req, res) => {
        const indexHTML = baseIndexHTML
            .replace(/{{title}}/g, 'About - MLGA Network')
            .replace(/{{description}}/g, 'The Make Liberty Great Again (MLGA) Pødcast Network provides informative and entertaining content from passionate libertarian hosts.')
            .replace(/{{image}}/g, 'https://mlganetwork.com/images/mlga-network.jpg')
            .replace(/{{imageWidth}}/g, '1024')
            .replace(/{{imageHeight}}/g, '1024')
            .replace(/{{uri}}/g, '');
        res.send(indexHTML);
    })
    .get('/contact', (req, res) => {
        const indexHTML = baseIndexHTML
            .replace(/{{title}}/g, 'Contact - MLGA Network')
            .replace(/{{description}}/g, 'The Make Liberty Great Again (MLGA) Pødcast Network provides informative and entertaining content from passionate libertarian hosts.')
            .replace(/{{image}}/g, 'https://mlganetwork.com/images/mlga-network.jpg')
            .replace(/{{imageWidth}}/g, '1024')
            .replace(/{{imageHeight}}/g, '1024')
            .replace(/{{uri}}/g, '');
        res.send(indexHTML);
    })
    .get('/channel/:slug', (req, res) => {
        const { slug } = req.params;
        db.feeds.findOne({ slug }, (err, feed) => {
            if(err) {
                handleError(err);
                res.sendStatus(500);
            } else if(feed) {
                const indexHTML = baseIndexHTML
                    .replace(/{{title}}/g, escape(feed.title + ' on MLGA Pødcast Network'))
                    .replace(/{{description}}/g, escape(`Listen to ${feed.title} on the MLGA Pødcast Network.`))
                    .replace(/{{image}}/g, secureUrl(feed.image.url))
                    .replace(/{{imageWidth}}/g, '')
                    .replace(/{{imageHeight}}/g, '')
                    .replace(/{{uri}}/g, `/channel/${feed.slug}`);
                res.send(indexHTML);
            } else {
                const feedUrl = slug;
                db.feeds.findOne({ feedUrl }, (err1, feed1) => {
                    if(err1) {
                        handleError(err1);
                        res.sendStatus(500);
                    } else if(!feed1) {
                        res.sendStatus(404);
                    } else {
                        res.redirect(301, `/channel/${feed1.slug}`);
                    }
                });
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
