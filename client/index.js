import React from 'react';
import ReactDom from 'react-dom';
import { BrowserRouter as Router, Route, IndexRoute } from 'react-router-dom';
import { createStore, combineReducers } from 'redux';
import { Provider } from 'react-redux';
import App from './components/app';
import Footer from './components/footer';
import appReducer from './reducer';
import { setWindowSize } from './actions';

window.handleError = err => {
    console.error(err);
};

const combinedReducers = combineReducers({
    appState: appReducer
});

const store = createStore(combinedReducers);

store.subscribe(() => {
    const state = store.getState();
    console.log('state', state.appState);
});

window.addEventListener('resize', e => {
    const { innerWidth, innerHeight } = e.target;
    store.dispatch(setWindowSize({
        width: innerWidth,
        height: innerHeight
    }));
});

const AppRouter = () => {

    const styles = {
        container: {
            width: '100%',
            height: '100%',
            overflowX: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            flexWrap: 'nowrap',
            justifyContent: 'space-between'
        }
    };

    return (
        <Provider store={store}>
            <Router>
                <div style={styles.container}>
                    <Route path={'/'} exact={true} component={App} />
                    <Route path={'/about'} component={App} />
                    <Route path={'/contact'} component={App} />
                    <Route path={'/channel/:slug'} component={App} />
                    <Footer />
                </div>
            </Router>
        </Provider>
    );
};

ReactDom.render(
    <AppRouter />,
    document.getElementById('js-app')
);
