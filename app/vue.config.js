const CompressionPlugin = require('compression-webpack-plugin');

module.exports = {
    pages: {
        index: {
            entry: 'src/main.js',
            template: 'public/index.html',
            filename: 'index.html',
            title: 'Scroll-It'
        }
    },
    integrity: true,
    transpileDependencies: [
        'vuetify'
    ],
    configureWebpack: {
        plugins: [
            new CompressionPlugin()
        ]
    }
}
