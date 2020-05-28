const path = require('path');
const CompressionPlugin = require('compression-webpack-plugin');
const {GenerateSW} = require('workbox-webpack-plugin');
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
    configureWebpack: {
        plugins: [
            new CleanWebpackPlugin(),
            new GenerateSW(),
            new CompressionPlugin()
        ],
        output: {
            filename: '[name].[contenthash].js',
            path: path.resolve(__dirname, 'dist')
        },
        optimization: {
            moduleIds: 'hashed',
            runtimeChunk: 'single',
            splitChunks: {
                cacheGroups: {
                    vendor: {
                        test: /[\\/]node_modules[\\/]/,
                        name: 'vendors',
                        chunks: 'all'
                    }
                }
            }
        }
    }
}
