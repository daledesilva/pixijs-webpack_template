const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: './src/index.js',
  plugins: [
    new CleanWebpackPlugin(),
    new CopyPlugin({
        patterns: [
            { from: 'src/assets', to: 'assets' },
            { from: 'src/index.html', to: ''},
            { from: 'src/style.css', to: ''},
        ]
    })
  ],
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist')
  }
};