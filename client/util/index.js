export const secureUrl = (url = '') => {
    return url.replace(/^http:/, 'https:');
};

export const getWindowSize = width => {
    if(width > 991) {
        return 'lg';
    } else if(width > 767) {
        return 'md';
    } else if(width > 575) {
        return 'sm';
    } else {
        return 'xs';
    }
};
