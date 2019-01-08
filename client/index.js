import React from 'react';
import ReactDom from 'react-dom';
import App from './app';
import { BrowserRouter as Router, Route } from 'react-router-dom';

window.handleError = err => {
    console.error(err);
};

const AppRouter = () => {
    return (
        <Router>
            <div style={{overflowX: 'hidden'}}>
                <Route path={'/'} exact={true} component={App} />
                <Route path={'/channel/:id'} component={App} />
            </div>
        </Router>
    );
};

ReactDom.render(
    <AppRouter />,
    document.getElementById('js-app')
);
