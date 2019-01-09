export const secureUrl = (url = '') => {
    return url.replace(/^http:/, 'https:');
};
