const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

var isDev = false;
if(process.env.NODE_ENV === 'development') {
    isDev = true;
}

module.exports = {
  entry: [
    // './src/index.ts',
    './src/index.js'
  ],
  module: {
    rules: [
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
        {
            test: /\.s[ac]ss$/i,
            // Bottom loaders run first
            use: [
                // Inserts style as link to css file
                // (Doesn't allow hot module replacement during dev - ie. doesn't update css upon with or without refresh)
                // {
                //     loader: "style-loader",
                //     options: {
                //         injectType: "linkTag"
                //     }
                // },
                // {
                //     loader: 'file-loader',
                //     options: {
                //         name: './[name].css',
                //     },
                // },
                
                // Convert and insert style with javascript
                // (Allows for hot module replacement during dev - ie. updates without requiring a refresh)
                // TODO: This could be used in the watch mode automatically while using the above for production
                // Would need separate webpack configuration file
                "style-loader",
                "css-loader",

                // Compiles Sass to CSS
                {
                    loader: "sass-loader",
                    options: {
                        sassOptions: {
                            outputStyle: isDev ? 'expanded' : 'compressed',
                            sourceComments: isDev ? true : false,
                            sourceMap: isDev ? true : false
                        }
                    }
                }
            ]
        },
        {
            test: /\.(png|jpe?g|gif)$/i,
            use: [
                {
                    loader: 'file-loader',
                    options: {
                        name: './assets/[name].[ext]',
                    },
                }
            ],
        },
      ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  plugins: [
    new CleanWebpackPlugin(),
    new CopyPlugin({
        patterns: [
            // Index.html isn't references in any js files, so needs to be copied with CopyPlugin
            { from: 'src/index.html', to: ''},
        ]
    })
  ],
  optimization: {
    minimize: isDev ? false : true
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist')
  },
  watch: process.env.NODE_WATCH
};