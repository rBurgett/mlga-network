import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { secureUrl } from '../util';

const SidebarItem = ({ feed }) => {
    const to = `/channel/${encodeURIComponent(feed.feedUrl)}`;
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

const Sidebar = ({ feeds }) => {
    return (
        <div className={'list-group'} style={{marginBottom: 20}}>
            <Link className={'list-group-item list-group-item-action'} to={'/'}>
                <div style={{display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', justifyContent: 'flex-start'}}>
                    <div style={{width: 50, height: 50}}>
                        <i className="fas fa-home" style={{fontSize: 50}}></i>
                    </div>
                    <div style={{marginLeft: 15}}>
                        <h4 style={{lineHeight: '50px', marginTop: 0, marginBottom: 0}}>{'Home'}</h4>
                    </div>
                </div>
            </Link>
            {feeds.map(feed => {
                return (
                    <SidebarItem key={feed.feedUrl} feed={feed} />
                );
            })}
        </div>
    );
};
Sidebar.propTypes = {
    feeds: PropTypes.arrayOf(PropTypes.object)
};

export default Sidebar;
