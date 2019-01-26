import React from 'react';
import PropTypes from 'prop-types';

class ShowMenu extends React.Component {

    componentDidMount() {
        const { windowHeight } = this.props;
        setTimeout(() => {
            this.mainNode.style.maxHeight = windowHeight - 50 + 'px';
        }, 0);
    }

    render() {

        const { children } = this.props;

        const styles = {
            container: {
                position: 'fixed',
                left: 0,
                right: 0,
                bottom: 50,
                maxHeight: 0,
                overflowY: 'scroll',
                overflowX: 'hidden'
            }
        };

        return (
            <div className={'height-transition'} ref={node => this.mainNode = node} style={styles.container}>
                {children}
            </div>
        );
    }

}
ShowMenu.propTypes = {
    windowHeight: PropTypes.number,
    children: PropTypes.element
};

export default ShowMenu;
