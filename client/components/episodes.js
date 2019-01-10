import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { Map } from 'immutable';
import bindAll from 'lodash/bindAll';
import ReactPlayer from 'react-player';
import request from 'superagent';
import { secureUrl } from '../util';

class Episode extends React.Component {

    constructor(props) {
        super(props);
    }

    render() {

        const { feed, episode, expanded } = this.props;

        const formattedDate = moment(episode.isoDate).format('MMMM D, YYYY');

        const styles = {
            flexContainer: {
                display: 'flex',
                flexDirection: 'row',
                flexWrap: 'nowrap',
                justifyContent: 'flex-start',
                marginBottom: 20,
                borderColor: '#ddd',
                borderWidth: 1,
                borderStyle: 'solid',
                padding: 10
            },
            col1: {
                minWidth: 100,
                width: 100,
                height: 100,
                marginRight: 15
            },
            col2: {
                flexGrow: 1
            }
        };

        return (
            <div style={styles.flexContainer}>
                <img alt={feed.title} src={secureUrl(feed.image.url)} style={styles.col1}></img>
                <div style={styles.col2}>
                    <h3 style={{marginTop: 0}}>{episode.title} <a href="#" className={'text-success'} onClick={e => this.props.play(e, episode.guid)}><i className="fas fa-play-circle"></i></a></h3>
                    <div>{formattedDate} - {episode.contentSnippet}</div>
                    {expanded ?
                        <ReactPlayer url={secureUrl(episode.enclosure.url)} onEnded={this.props.ended} controls={true} height={60} playing={true} disabledPlayers={['SoundCloud']} />
                        :
                        <div></div>
                    }
                </div>
            </div>
        );
    }

}
Episode.propTypes = {
    feed: PropTypes.object,
    episode: PropTypes.object,
    expanded: PropTypes.bool,
    play: PropTypes.func,
    ended: PropTypes.func
};

class Episodes extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            expanded: '',
            episodes: []
        };
        bindAll(this, [
            'loadEpisodes',
            'onPlay',
            'onEnded'
        ]);
    }

    loadEpisodes(quantity, feed) {
        request.get(`/api/episodes?q=${quantity}&f=${encodeURIComponent(feed)}`)
            .then(({ text }) => {
                const episodes = JSON.parse(text);
                this.setState({
                    ...this.state,
                    episodes
                });
            })
            .catch(handleError);
    }

    UNSAFE_componentWillReceiveProps(newProps) {
        if(newProps.feedId && (this.state.episodes.length === 0 || newProps.feedId !== this.props.feedId || newProps.quantity !== this.props.quantity)) {
            this.loadEpisodes(newProps.quantity, newProps.feedId);
        }
    }

    onPlay(e, guid) {
        e.preventDefault();
        this.setState({
            ...this.state,
            expanded: guid
        });
    }

    onEnded() {
        const { expanded } = this.state;
        const episodes = this.props.feedId ? this.state.episodes : this.props.episodes;
        const idx = episodes.findIndex(e => e.guid === expanded);
        if(idx > 0) {
            this.setState({
                ...this.state,
                expanded: episodes[idx - 1].guid
            });
        } else {
            this.setState({
                ...this.state,
                expanded: ''
            });
        }
    }

    render() {

        const { expanded } = this.state;
        const { feedId, feeds, episodes } = this.props;
        const feedsMap = feeds.reduce((map, f) => {
            return map.set(f.feedUrl, f);
        }, Map());

        const episodesToUse = !feedId ? episodes : this.state.episodes.length === 0 ? this.state.episodes : this.state.episodes[0].feedUrl === feedId ? this.state.episodes : [];

        return (
            <div>
                {feedId ?
                    <div>
                        <h2 style={{marginTop: 0}}>{feedsMap.get(feedId).title}</h2>
                        <p><a href={feedsMap.get(feedId).link} target={'_blank'}>{feedsMap.get(feedId).link}</a></p>
                        <p>{feedsMap.get(feedId).description}</p>
                    </div>
                    :
                    <div></div>
                }
                {episodesToUse.map(e => {
                    return (
                        <Episode key={e.guid} episode={e} feed={feedsMap.get(e.feedUrl)} play={this.onPlay} expanded={expanded === e.guid} ended={this.onEnded} />
                    );
                })}
            </div>
        );
    }

}
Episodes.propTypes = {
    feedId: PropTypes.string,
    feeds: PropTypes.arrayOf(PropTypes.object),
    episodes: PropTypes.arrayOf(PropTypes.object),
    quantity: PropTypes.number
};

export default Episodes;
