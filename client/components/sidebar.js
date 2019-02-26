import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { secureUrl } from '../util';
import * as actions from '../actions';

const SidebarItem = ({ feed }) => {
    const to = `/channel/${feed.slug}`;
    return (
        <Link to={to} className={'list-group-item list-group-item-action'}>
             <div style={{display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', justifyContent: 'flex-start'}}>
                 <img alt={feed.title} src={secureUrl(feed.image.url)} style={{minWidth: 50, width: 50, height: 50}}></img>
                 <div style={{marginLeft: 15}}>
                     <h4 style={{fontSize: 14, lineHeight: '50px', marginTop: 0, marginBottom: 0}}>{feed.title}</h4>
                 </div>
             </div>
         </Link>
    );
};
SidebarItem.propTypes = {
    feed: PropTypes.object
};

const Sidebar = ({ title, feeds, setExpandShows }) => {

    const styles = {
        listGroup: {
            marginBottom: title ? 0 : 20
        },
        inactiveListGroupItem: {
            borderRadius: 0,
            outline: 'none',
            borderWidth: 0
        },
        closeLink: {
            display: 'block',
            float: 'right',
            lineHeight: '50px',
            fontSize: '1.5rem',
            marginRight: 10
        }
    };

    const onClick = () => {
        if(title) {
            setExpandShows(false);
        }
        document.getElementById('js-mainContainer').scrollTo(0, 0);
    };
    const onTitleClick = e => {
        e.preventDefault();
        e.stopPropagation();
    };
    const onCloseClick = e => {
        e.preventDefault();
        setExpandShows(false);
    };

    return (
        <div className={'list-group'} style={styles.listGroup} onClick={onClick}>
            {title ?
                <div className={'list-group-item list-group-item-dark'} style={styles.inactiveListGroupItem} onClick={onTitleClick}>
                    <div style={{display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', justifyContent: 'flex-start'}}>
                        <div>
                            <h4 style={{lineHeight: '50px', marginTop: 0, marginBottom: 0}}>{'Shows'}</h4>
                        </div>
                        <div style={{flexGrow: 1}}>
                            <a className={'text-muted'} href={'#'} style={styles.closeLink} onClick={onCloseClick}><i className="fas fa-times"></i></a>
                        </div>
                    </div>
                </div>
                :
                <Link className={'list-group-item list-group-item-action'} to={'/'} style={{outline: 'none'}}>
                    <div style={{display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', justifyContent: 'flex-start'}}>
                        <div style={{width: 50, height: 50}}>
                            <i className="fas fa-home" style={{fontSize: 50}}></i>
                        </div>
                        <div style={{marginLeft: 15}}>
                            <h4 style={{lineHeight: '50px', marginTop: 0, marginBottom: 0}}>{'Home'}</h4>
                        </div>
                    </div>
                </Link>
            }
            {feeds.map(feed => {
                return (
                    <SidebarItem key={feed.slug} feed={feed} />
                );
            })}
        </div>
    );
};
Sidebar.propTypes = {
    title: PropTypes.string,
    feeds: PropTypes.arrayOf(PropTypes.object),
    setExpandShows: PropTypes.func
};

const SidebarContainer = connect(
    null,
    dispatch => ({
        setExpandShows(expandShows) {
            dispatch(actions.setExpandShows({ expandShows }));
        }
    })
)(Sidebar);

export default SidebarContainer;
