const CompressionPlugin = require('compression-webpack-plugin');
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
        plugins: [
            new GenerateSW(),
            new CompressionPlugin()
        ]
    }
}
