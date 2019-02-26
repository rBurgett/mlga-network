import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import request from 'superagent';
import bindAll from 'lodash/bindAll';
import Sidebar from './sidebar';
import Episodes from './episodes';
import About from './about';
import Contact from './contact';
import * as actions from '../actions';
import { getWindowSize } from '../util';
import ShowMenu from './show-menu';

class App extends React.Component {

    constructor(props) {
        super(props);
        bindAll(this, [
            'loadFeeds',
            'loadEpisodes',
            'loadMore'
        ]);
    }

    UNSAFE_componentWillMount() {
        this.loadFeeds();
        const { quantity } = this.props;
        this.loadEpisodes(quantity);
        this.props.setExpanded('');
    }

    loadFeeds() {
        request.get('/api/feeds')
            .then(({ text }) => {
                let feeds = JSON.parse(text);
                const idx = feeds.findIndex(e => e.title === 'Make Liberty Great Again');
                if(idx > -1) feeds = [
                    feeds[idx],
                    ...feeds.slice(0, idx),
                    ...feeds.slice(idx + 1)
                ];
                this.props.setFeeds(feeds);
            })
            .catch(handleError);
    }

    loadEpisodes(quantity) {
        request.get(`/api/episodes?q=${quantity}`)
            .then(({ text }) => {
                const episodes = JSON.parse(text);
                this.props.setEpisodes(episodes);
            })
            .catch(handleError);
    }

    loadMore(e) {
        e.preventDefault();
        const newQuantity = this.props.quantity + 20;
        this.props.setQuantity(newQuantity);
        this.loadEpisodes(newQuantity);
    }

    render() {

        const { feeds, match, windowWidth, windowHeight, expandShows } = this.props;

        const windowSize = getWindowSize(windowWidth);

        const path = match.path.toLowerCase();

        const hideShows = ['xs', 'sm', 'md'].includes(windowSize);

        const styles = {
            container: {
                flexGrow: 1,
                overflowY: expandShows ? 'hidden' : 'scroll'
            }
        };

        return (
            <div id="js-mainContainer" style={styles.container}>
                <div className={'container-fluid'}>
                    <div className={'row'}>
                        <div className={'col'}>
                            <h1 className={'text-center'} style={{marginTop: 20, marginBottom: 20}}>{'MLGA Pødcast Network'}</h1>
                        </div>
                    </div>
                    {feeds.length > 0 ?
                        <div className={'row'}>
                            {hideShows ?
                                <div></div>
                                :
                                <div className={'col-lg-4 col-md-12'}>
                                    <Sidebar feeds={feeds} />
                                </div>
                            }
                            <div className={'col-lg-8 col-md-12'}>
                                {path === '/about' ?
                                    <About />
                                    :
                                    path === '/contact' ?
                                        <Contact />
                                        :
                                        <Episodes feedId={match.params.id ? decodeURIComponent(match.params.id) : ''} loadMore={this.loadMore} />
                                }
                            </div>
                        </div>
                        :
                        <div></div>
                    }
                </div>

                {expandShows ?
                    <ShowMenu windowHeight={windowHeight}>
                        <Sidebar feeds={feeds} title={'Shows'} />
                    </ShowMenu>
                    :
                    <div></div>
                }
            </div>
        );
    }

}
App.propTypes = {
    quantity: PropTypes.number,
    windowWidth: PropTypes.number,
    windowHeight: PropTypes.number,
    feeds: PropTypes.arrayOf(PropTypes.object),
    episodes: PropTypes.arrayOf(PropTypes.object),
    match: PropTypes.object,
    expandShows: PropTypes.bool,
    setFeeds: PropTypes.func,
    setEpisodes: PropTypes.func,
    setQuantity: PropTypes.func,
    setExpanded: PropTypes.func
};
const AppContainer = withRouter(connect(
    ({ appState }) => ({
        quantity: appState.quantity,
        feeds: appState.feeds,
        episodes: appState.episodes,
        windowWidth: appState.windowWidth,
        windowHeight: appState.windowHeight,
        expandShows: appState.expandShows
    }),
    dispatch => ({
        setFeeds: feeds => {
            dispatch(actions.setFeeds({ feeds }));
        },
        setEpisodes: episodes => {
            dispatch(actions.setEpisodes({ episodes }));
        },
        setQuantity: quantity => {
            dispatch(actions.setQuantity({ quantity }));
        },
        setExpanded: expanded => {
            dispatch(actions.setExpanded({ expanded }));
        }
    })
)(App));

export default AppContainer;
