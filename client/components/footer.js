import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { getWindowSize } from '../util';
import * as actions from '../actions';

const Footer = ({ windowWidth, expandShows, setExpandShows }) => {

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
        linkContainer: {
            display: 'flex',
            flexDirection: 'row',
            flexWrap: 'nowrap',
            justifyContent: 'flex-start',
            flexGrow: 1
        },
        navLink: {
            flexGrow: 0,
            display: 'block',
            lineHeight: '50px',
            fontWeight: 'bold',
            marginRight: 30
        },
        linkText: {
            display: ['xs', 'sm'].includes(windowSize) ? 'none' : 'inline'
        },
        designNote: {
            display: ['xs', 'sm', 'md'].includes(windowSize) ? 'none' : 'block',
            flexGrow: 1,
            textAlign: 'right',
            lineHeight: '50px',
            fontWeight: 'bold'
        }
    };

    if(['xs', 'sm'].includes(windowSize)) {
        styles.navLink.flexGrow = 1;
        styles.navLink.flexBasis = 1;
        styles.navLink.marginRight = 0;
        styles.navLink.textAlign = 'center';
        styles.footerContainer.paddingLeft = 0;
        styles.footerContainer.paddingRight = 0;
    }

    const onExpandShowsClick = e => {
        e.preventDefault();
        setExpandShows(!expandShows);
    };

    return (
        <div style={styles.footerContainer}>
            <div style={styles.linkContainer}>
                <Link style={styles.navLink} className={'footer-link'} to="/"><i className="fas fa-home"></i><span style={styles.linkText}> Home</span></Link>
                {['xs', 'sm', 'md'].includes(windowSize) ? <a href={'#'} style={styles.navLink}  className={'footer-link'} onClick={onExpandShowsClick}><i className="far fa-list-alt"></i><span style={styles.linkText}> Shows</span></a> : <div></div>}
                <Link style={styles.navLink}  className={'footer-link'} to="/about"><i className="fas fa-info-circle"></i><span style={styles.linkText}> About</span></Link>
                <Link style={styles.navLink} className={'footer-link'} to="/contact"><i className="fas fa-envelope"></i><span style={styles.linkText}> Contact</span></Link>
                <a style={styles.navLink} className={'footer-link'} href={'https://itunes.apple.com/us/podcast/mlga-p%C3%B8dcast-network/id1449333590?mt=2'} target={'_blank'}><i className="fab fa-itunes-note"></i><span style={styles.linkText}> iTunes</span></a>
                <a style={styles.navLink} className={'footer-link'} href={'/audio/rss'} target={'_blank'}><i className="fas fa-rss"></i><span style={styles.linkText}> RSS</span></a>
            </div>
            <div style={styles.designNote}>Site designed and built by <a href="https://burgettdev.net">Burgett Dev Services LLC</a>.</div>
        </div>
    );
};
Footer.propTypes = {
    windowWidth: PropTypes.number,
    expandShows: PropTypes.bool,
    setExpandShows: PropTypes.func
};

const FooterContainer = connect(
    ({ appState }) => ({
        windowWidth: appState.windowWidth,
        expandShows: appState.expandShows
    }),
    dispatch => ({
        setExpandShows(expandShows) {
            dispatch(actions.setExpandShows({ expandShows }));
        }
    })
)(Footer);

export default FooterContainer;
