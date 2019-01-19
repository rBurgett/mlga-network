import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { getWindowSize } from '../util';

const Footer = ({ windowWidth }) => {

    const windowSize = getWindowSize(windowWidth);

    const styles = {
        footerContainer: {
            width: '100%',
            minHeight: 50,
            height: 50,
            backgroundColor: '#efefef',
            display: 'flex',
            flexDirecton: 'row',
            flexWrap: 'nowrap',
            justifyContents: 'space-between',
            paddingLeft: 15,
            paddingRight: 15
        },
        navLink: {
            lineHeight: '50px',
            fontWeight: 'bold',
            marginRight: 30
        },
        designNote: {
            display: ['xs', 'sm'].includes(windowSize) ? 'none' : 'block',
            flexGrow: 1,
            textAlign: 'right',
            lineHeight: '50px',
            fontWeight: 'bold'
        }
    };

    return (
        <div style={styles.footerContainer}>
            <div>
                <Link style={styles.navLink} className={'footer-link'} to="/"><i className="fas fa-home"></i> Home</Link>
                <Link style={styles.navLink}  className={'footer-link'} to="/about"><i className="fas fa-info-circle"></i> About</Link>
                <Link style={styles.navLink} className={'footer-link'} to="/contact"><i className="fas fa-envelope"></i> Contact</Link>
            </div>
            <div style={styles.designNote}>Site designed and built by <a href="https://ryanburgett.com">Ryan Burgett</a>.</div>
        </div>
    );
};
Footer.propTypes = {
    windowWidth: PropTypes.number
};

const FooterContainer = connect(
    ({ appState }) => ({
        windowWidth: appState.windowWidth
    })
)(Footer);

export default FooterContainer;
