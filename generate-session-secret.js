const uuid = require('uuid');

const secret = [1, 2, 3, 4]
    .map(() => uuid.v4())
    .join('')
    .replace(/-/g, '');

console.log(secret);
