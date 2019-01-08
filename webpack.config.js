const path = require('path');
const webpack = require('webpack');

module.exports = {
    entry: './client/index.js',
    output: {
        path: path.resolve(__dirname, 'public', 'js'),
        filename: 'index.js'
    },
    stats: {
        colors: true
    },
    plugins: [
        // new webpack.DefinePlugin({
        //     'process.env': {
        //         'NODE_ENV': JSON.stringify('production')
        //     }
        // })
    ],
    module: {
        rules: [
            {
                test: /\.jsx?$/,
                exclude: /(node_modules)/,
                use: {
                    loader: 'babel-loader'
                }
            }
        ]
    }
};
