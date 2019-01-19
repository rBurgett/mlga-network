export const setWindowSize = ({ width, height }) => ({
    type: 'SET_WINDOW_SIZE',
    payload: {
        width,
        height
    }
});
export const setFeeds = ({ feeds }) => ({
    type: 'SET_FEEDS',
    payload: {
        feeds
    }
});
export const setEpisodes = ({ episodes }) => ({
    type: 'SET_EPISODES',
    payload: {
        episodes
    }
});
export const setQuantity = ({ quantity }) => ({
    type: 'SET_QUANTITY',
    payload: {
        quantity
    }
});
export const setFeedEpisodes = ({ feedEpisodes }) => ({
    type: 'SET_FEED_EPISODES',
    payload: {
        feedEpisodes
    }
});
export const setExpanded = ({ expanded }) => ({
    type: 'SET_EXPANDED',
    payload: {
        expanded
    }
});

