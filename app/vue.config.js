const path = require('path');
const CompressionPlugin = require('compression-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const {GenerateSW} = require('workbox-webpack-plugin');

module.exports = {
    pages: {
        index: {
            entry: 'src/main.js',
            template: 'public/index.html',
            filename: 'index.html',
            title: 'Scroll-It'
        }
    },
    crossorigin: 'anonymous',
    integrity: true,
    transpileDependencies: [
        'vuetify'
    ],
    configureWebpack: {
        mode: 'production',
        plugins: [
            new CleanWebpackPlugin(),
            new CompressionPlugin(),
            // new GenerateSW({
            //     mode: 'production',
            //     clientsClaim: true,
            //     cleanupOutdatedCaches: true,
            //     skipWaiting: true,
            //     exclude: [/_redirects/, '/_redirects', ]
            // })
        ],
        output: {
            filename: '[name].[hash].js',
            path: path.resolve(__dirname, 'dist')
        }
    }
}
