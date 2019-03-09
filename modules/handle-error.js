class ErrorHandler {

    constructor({ mailgun }) {
        this._mailgun = mailgun;
    }

    handle(err) {
        console.error(err);
        if(process.env.NODE_ENV === 'production') {
            const { _mailgun: mailgun } = this;
            const emailData = {
                from: 'MLGA Network <no-reply@mlganetwork.com>',
                to: 'ryan@burgettweb.net',
                subject: 'ERROR - mlganetwork.com',
                text: `${err.message}\n\n${err.stack}`
            };
            mailgun.messages().send(emailData, err1 => {
                if(err1) console.error(err1);
            });
        }
    }

}

module.exports = ErrorHandler;
