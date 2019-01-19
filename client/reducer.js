import { Map } from 'immutable';

const getInitialState = () => ({
    quantity: 20,
    feeds: [],
    episodes: [],
    feedEpisodes: Map(),
    expanded: ''
});

export default (state = getInitialState(), { type, payload }) => {
    switch(type) {
        case 'SET_WINDOW_SIZE':
            return {
                ...state,
                windowHeight: payload.height,
                windowWidth: payload.width
            };
        case 'SET_FEEDS':
            return {
                ...state,
                feeds: payload.feeds
            };
        case 'SET_EPISODES':
            return {
                ...state,
                episodes: payload.episodes
            };
        case 'SET_QUANTITY':
            return {
                ...state,
                quantity: payload.quantity
            };
        case 'SET_FEED_EPISODES':
            return {
                ...state,
                feedEpisodes: payload.feedEpisodes
            };
        case 'SET_EXPANDED':
            return {
                ...state,
                expanded: payload.expanded
            };
        default:
            return state;
    }
};
