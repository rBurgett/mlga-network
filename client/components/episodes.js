import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import moment from 'moment';
import { Map } from 'immutable';
import bindAll from 'lodash/bindAll';
import ReactPlayer from 'react-player';
import request from 'superagent';
import { secureUrl, getWindowSize } from '../util';
import * as actions from '../actions';

let Episode = ({ feed, episode, expanded, windowWidth, play, ended }) => {

    const windowSize = getWindowSize(windowWidth);

    const formattedDate = moment(episode.isoDate).format('MMMM D, YYYY');

    const styles = {
        container: {
            marginBottom: 20,
            borderColor: '#ddd',
            borderWidth: 1,
            borderStyle: 'solid',
            padding: 10
        },
        flexContainer: {
            display: 'flex',
            flexDirection: 'row',
            flexWrap: 'nowrap',
            justifyContent: 'flex-start'
        },
        col1: {
            minWidth: windowSize === 'xs' ? 50 : 100,
            width: windowSize === 'xs' ? 50 : 100,
            height: windowSize === 'xs' ? 50 : 100,
            marginRight: 15
        },
        col2: {
            flexGrow: 1,
            overflow: 'hidden'
        },
        contentContainer: {
            overflowWrap: 'break-word'
        }
    };

    styles.contentContainer = ['sm', 'xs'].includes(windowSize) ? {fontSize: 14} : styles.contentContainer;

    return (
        <div style={styles.container}>
            <div style={styles.flexContainer}>
                <img alt={feed.title} src={secureUrl(feed.image.url)} style={styles.col1}></img>
                <div style={styles.col2}>
                    {['sm', 'xs'].includes(windowSize) ?
                        <h4 style={{marginTop: 0}}>{episode.title} <a href="#" className={'text-success'} onClick={e => play(e, episode.guid)}><i className="fas fa-play-circle"></i></a></h4>
                        :
                        <h3 style={{marginTop: 0}}>{episode.title} <a href="#" className={'text-success'} onClick={e => play(e, episode.guid)}><i className="fas fa-play-circle"></i></a></h3>
                    }
                    {windowSize !== 'xs' ?
                        <div style={{overflow: 'hidden'}}>
                            <div style={styles.contentContainer}>{formattedDate} - {episode.contentSnippet}</div>
                            {expanded ?
                                <div style={{position: 'relative'}}>
                                    <ReactPlayer url={secureUrl(episode.enclosure.url)} onEnded={ended} controls={true} width={'100%'} height={60} playing={true} disabledPlayers={['SoundCloud']} />
                                </div>
                                :
                                <div></div>
                            }
                        </div>
                        :
                        <div></div>
                    }
                </div>
            </div>
            {windowSize === 'xs' ?
                <div style={{overflow: 'hidden'}}>
                    <div style={styles.contentContainer}>{formattedDate} - {episode.contentSnippet}</div>
                    {expanded ?
                        <div style={{position: 'relative'}}>
                            <ReactPlayer url={secureUrl(episode.enclosure.url)} onEnded={ended} controls={true} width={'100%'} height={60} playing={true} disabledPlayers={['SoundCloud']} />
                        </div>
                        :
                        <div></div>
                    }
                </div>
                :
                <div></div>
            }
        </div>
    );
};
Episode.propTypes = {
    feed: PropTypes.object,
    episode: PropTypes.object,
    expanded: PropTypes.bool,
    windowWidth: PropTypes.number,
    play: PropTypes.func,
    ended: PropTypes.func
};
Episode = connect(
    ({ appState }) => ({
        windowWidth: appState.windowWidth
    })
)(Episode);

class Episodes extends React.Component {

    constructor(props) {
        super(props);
        bindAll(this, [
            'loadEpisodes',
            'onPlay',
            'onEnded'
        ]);
    }

    loadEpisodes(quantity, slug) {
        const { setLoading } = this.props;
        setLoading(slug);
        request.get(`/api/episodes?q=${quantity}&f=${slug}`)
            .then(({ text }) => {
                const episodes = JSON.parse(text);
                const { feedEpisodes } = this.props;
                const newFeedEpisodes = feedEpisodes.set(slug, episodes);
                this.props.setFeedEpisodes(newFeedEpisodes);
                setLoading('');
            })
            .catch(handleError);
    }

    UNSAFE_componentWillMount() {
        const { feedEpisodes, slug, quantity } = this.props;
        if(slug) {
            if(!feedEpisodes.has(slug)) {
                this.loadEpisodes(quantity, slug);
            }
        }
    }

    UNSAFE_componentWillReceiveProps(newProps) {
        const { loading } = newProps;
        const { feedEpisodes } = this.props;
        if(newProps.slug) {
            if(!feedEpisodes.has(newProps.slug) || newProps.slug !== this.props.slug) {
                if(loading !== newProps.slug) {
                    this.loadEpisodes(newProps.quantity, newProps.slug);
                }
            }
        }
    }

    onPlay(e, guid) {
        e.preventDefault();
        this.props.setExpanded(guid);
    }

    onEnded() {
        const { slug, episodes, feedEpisodes, expanded } = this.props;
        const selectedEpisodes = !slug ? episodes : feedEpisodes.get(slug);
        const idx = selectedEpisodes.findIndex(e => e.guid === expanded);
        if(idx > 0) {
            this.props.setExpanded(selectedEpisodes[idx - 1].guid);
        } else {
            this.props.setExpanded('');
        }
    }

    render() {

        const { slug, feeds, episodes, expanded, feedEpisodes } = this.props;

        const feedsMap = feeds.reduce((map, f) => {
            return map.set(f.slug, f);
        }, Map());

        let episodesToUse;
        if(!slug) {
            episodesToUse = episodes;
        } else if(feedEpisodes.has(slug)) {
           episodesToUse = feedEpisodes.get(slug);
        } else {
            episodesToUse = [];
        }

        return (
            <div>
                <div>
                    {slug ?
                        <div>
                            <h2 style={{marginTop: 0}}>{feedsMap.get(slug).title}</h2>
                            <div className={'btn-group'} style={{marginTop: 10, marginBottom: 15}}>
                                <a className={'btn btn-outline-secondary'} href={feedsMap.get(slug).link} target={'_blank'}><i className={'fas fa-globe'} /> Web</a>
                                {/*<a className={'btn btn-outline-secondary'} href={feedsMap.get(slug).feedUrl} target={'_blank'}><i className={'fab fa-patreon'} /> Patreon</a>*/}
                                {/*<a className={'btn btn-outline-secondary'} href={feedsMap.get(slug).feedUrl} target={'_blank'}><i className={'fab fa-itunes-note'} /> iTunes</a>*/}
                                <a className={'btn btn-outline-secondary'} href={feedsMap.get(slug).feedUrl} target={'_blank'}><i className={'fas fa-rss'} /> RSS</a>
                            </div>
                            <p>{feedsMap.get(slug).description}</p>
                        </div>
                        :
                        <div></div>
                    }
                    {episodesToUse.map(e => {
                        return (
                            <Episode key={e.guid} episode={e} feed={feedsMap.get(e.slug) || feeds.find(f => f.feedUrl === e.feedUrl)} play={this.onPlay} expanded={expanded === e.guid} ended={this.onEnded} />
                        );
                    })}
                </div>
                <div style={{marginBottom: 20, display: episodesToUse.length > 0 ? 'block' : 'none'}}>
                    <button type={'button'} className={'btn btn-outline-secondary'} style={{display: 'block', margin: 'auto'}} onClick={() => slug ? this.loadEpisodes(episodesToUse.length + 20, slug) : this.props.loadMore()}>Load More</button>
                </div>
            </div>
        );
    }

}
Episodes.propTypes = {
    expanded: PropTypes.string,
    feedEpisodes: PropTypes.instanceOf(Map),
    loading: PropTypes.string,
    slug: PropTypes.string,
    feeds: PropTypes.arrayOf(PropTypes.object),
    episodes: PropTypes.arrayOf(PropTypes.object),
    quantity: PropTypes.number,
    loadMore: PropTypes.func,
    setFeedEpisodes: PropTypes.func,
    setExpanded: PropTypes.func,
    setLoading: PropTypes.func
};
const EpisodesContainer = connect(
    ({ appState }) => ({
        expanded: appState.expanded,
        feedEpisodes: appState.feedEpisodes,
        loading: appState.loading,
        feeds: appState.feeds,
        episodes: appState.episodes,
        quantity: appState.quantity
    }),
    dispatch => ({
        setFeedEpisodes: feedEpisodes => {
            dispatch(actions.setFeedEpisodes({ feedEpisodes }));
        },
        setExpanded: expanded => {
            dispatch(actions.setExpanded({ expanded }));
        },
        setLoading: loading => {
            dispatch(actions.setLoading({ loading }));
        }
    })
)(Episodes);

export default EpisodesContainer;
