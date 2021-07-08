const path = require('path');
const CompressionPlugin = require('compression-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

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
    css:{
        requireModuleExtension: true,
        loaderOptions: {
            css: {
                modules: {
                    localIdentName: '[name]-[hash]'
                },
                localsConvention: 'camelCaseOnly'
            }
        }
    },
    configureWebpack: {
        mode: 'production',
        plugins: [
            new CleanWebpackPlugin(),
            new CompressionPlugin(),

        ],
        output: {
            filename: '[name].[hash].js',
            path: path.resolve(__dirname, 'dist')
        }
    }
}
