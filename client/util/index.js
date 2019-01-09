export const secureImagePath = (url = '') => {
    return url.replace(/^http:/, 'https:');
};
