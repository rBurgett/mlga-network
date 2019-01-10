import React from 'react';
import request from 'superagent';
import bindAll from 'lodash/bindAll';
import Sidebar from './sidebar';
import Episodes from './episodes';

class App extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            quantity: 20,
            feeds: [],
            episodes: []
        };
        bindAll(this, [
            'loadFeeds',
            'loadEpisodes',
            'loadMore'
        ]);
    }

    UNSAFE_componentWillMount() {
        this.loadFeeds();
        const { quantity } = this.state;
        this.loadEpisodes(quantity);
    }

    loadFeeds() {
        request.get('/api/feeds')
            .then(({ text }) => {
                const feeds = JSON.parse(text);
                this.setState({
                    ...this.state,
                    feeds
                });
            })
            .catch(handleError);
    }

    loadEpisodes(quantity) {
        request.get(`/api/episodes?q=${quantity}`)
            .then(({ text }) => {
                const episodes = JSON.parse(text);
                this.setState({
                    ...this.state,
                    episodes
                });
            })
            .catch(handleError);
    }

    loadMore(e) {
        e.preventDefault();
        const newQuantity = this.state.quantity + 20;
        this.setState({
            ...this.state,
            quantity: newQuantity
        });
        this.loadEpisodes(newQuantity);
    }

    render() {

        console.log(this.state);

        const { feeds, episodes } = this.state;

        return (
            <div className={'container-fluid'}>
                <div className={'row'}>
                    <div className={'col'}>
                        <h1 className={'text-center'} style={{marginBottom: 15}}>{'MLGA Pødcast Network'}</h1>
                    </div>
                </div>
                {feeds.length > 0 ?
                    <div className={'row'}>
                        <div className={'col-lg-4 col-md-6'}>
                            <Sidebar feeds={feeds} />
                        </div>
                        <div className={'col-lg-8 col-md-6'}>
                            <Episodes feeds={feeds} episodes={episodes} />
                            <div style={{marginBottom: 15, display: episodes.length > 0 ? 'block' : 'none'}}>
                                <button type={'button'} className={'btn btn-outline-secondary'} style={{display: 'block', margin: 'auto'}} onClick={this.loadMore}>Load More</button>
                            </div>
                        </div>
                    </div>
                    :
                    <div></div>
                }
            </div>
        );
    }

}

export default App;
