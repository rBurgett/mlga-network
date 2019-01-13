import React from 'react';

const Footer = () => {

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
        designNote: {
            flexGrow: 1,
            textAlign: 'right',
            lineHeight: '50px',
            fontWeight: 'bold'
        }
    };

    return (
        <div style={styles.footerContainer}>
            <div style={styles.designNote}>Site designed and built by <a href="https://ryanburgett.com">Ryan Burgett</a>.</div>
        </div>
    );
};

export default Footer;
