const crypto = require('crypto');

module.exports.pbkdf2 = (password, salt) => {
    return crypto
        .pbkdf2Sync(password, salt, 10000, 512, 'sha512')
        .toString('hex');
};

module.exports.generateSalt = length => {
    return crypto.randomBytes(Math.ceil(length / 2))
        .toString('hex')
        .slice(0, length);
};

module.exports.secureUrl = (url = '') => {
    return url.replace(/^http:/, 'https:');
};

module.exports.makeSlug = str => str
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '')
    .toLowerCase();
