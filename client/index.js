import React from 'react';
import ReactDom from 'react-dom';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import App from './components/app';
import Footer from './components/footer';

window.handleError = err => {
    console.error(err);
};

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
        <Router>
            <div style={styles.container}>
                <Route path={'/'} exact={true} component={App} />
                <Route path={'/about'} exact={true} component={App} />
                <Route path={'/contact'} exact={true} component={App} />
                <Route path={'/channel/:id'} component={App} />
                <Footer />
            </div>
        </Router>
    );
};

ReactDom.render(
    <AppRouter />,
    document.getElementById('js-app')
);
