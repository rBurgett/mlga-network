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
import NetworkTitle from './network-title';

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
                const mlga = feeds.find(e => e.title === 'Make Liberty Great Again');
                const ta = feeds.find(e => e.title === 'Techno-Agorist');
                const morningDrive = feeds.find(e => e.title.includes('David'));
                const fpf = feeds.find(e => e.title.includes('Foreign Policy'));
                const godarchy = feeds.find(e => e.title.includes('GodArchy'));
                const wall = feeds.find(e => e.title.includes('Wall'));
                const brushfires = feeds.find(e => e.title.includes('Brushfires'));
                const vixens = feeds.find(e => e.title.includes('Vixens'));
                const tyfys = feeds.find(e => e.title.includes('Servers'));
                const lesbertarian = feeds.find(e => e.title.includes('Lesbertarian'));
                if(mlga && ta && morningDrive && fpf && godarchy && wall && brushfires) {
                    feeds = [
                        mlga,
                        ta,
                        vixens,
                        tyfys,
                        lesbertarian,
                        morningDrive,
                        wall,
                        fpf,
                        godarchy,
                        brushfires,
                        ...feeds.filter(e => ![mlga, ta, morningDrive, fpf, godarchy, wall, brushfires, vixens, tyfys, lesbertarian].includes(e))
                    ];
                }
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
        if(e) e.preventDefault();
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
            },
            titleContainer: {
                paddingTop: 5
            },
            title: {
                width: 700,
                maxWidth: '90%'
            }
        };

        return (
            <div id="js-mainContainer" style={styles.container}>
                <div className={'container-fluid'}>
                    <div className={'row'}>
                        <div className={'col'}>
                            <div className={'d-flex flex-row justify-content-center flex-nowrap'} style={styles.titleContainer}>
                                <NetworkTitle style={styles.title} />
                            </div>
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
                                        <Episodes slug={match.params.slug} loadMore={this.loadMore} />
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
