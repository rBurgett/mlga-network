import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import bindAll from 'lodash/bindAll';
import ReactPlayer from 'react-player';
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
            expanded: ''
        };
        bindAll(this, [
            'onPlay',
            'onEnded'
        ]);
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
        const { episodes } = this.props;
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
        const { feeds, episodes } = this.props;
        const feedsMap = feeds.reduce((map, f) => {
            map.set(f.feedUrl, f);
            return map;
        }, new Map());

        return (
            <div>
                {episodes.map(e => {
                    return (
                        <Episode key={e.guid} episode={e} feed={feedsMap.get(e.feedUrl)} play={this.onPlay} expanded={expanded === e.guid} ended={this.onEnded} />
                    );
                })}
            </div>
        );
    }

}
Episodes.propTypes = {
    feeds: PropTypes.arrayOf(PropTypes.object),
    episodes: PropTypes.arrayOf(PropTypes.object)
};

export default Episodes;
