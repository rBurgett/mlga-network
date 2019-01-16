import React from 'react';

const Contact = () => {
    return (
        <div>
            <div className={'row'}>
                <div className={'col'}>
                    <h2 style={{marginTop: 0}}>{'Contact'}</h2>
                </div>
            </div>
            <div className={'row'}>
                <div className={'col'}>
                    <h4>Email:</h4>
                    <div>
                        <a href={'mailto:info@mlganetwork.com'}>info@mlganetwork.com</a>
                    </div>
                </div>
            </div>
            <div className={'row'}>
                <div className={'col'}>
                    <h4>Facebook:</h4>
                    <div>
                        <a href={'https://www.facebook.com/mlganetwork'}>https://www.facebook.com/mlganetwork</a>
                    </div>
                </div>
            </div>
            <div className={'row'}>
                <div className={'col'}>
                    <h4>Twitter:</h4>
                    <div>
                        <a href={'https://twitter.com/MLGANetwork'}>https://twitter.com/MLGANetwork</a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Contact;
