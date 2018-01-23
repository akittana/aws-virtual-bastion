var path = require('path');
var webpack = require('webpack');
// var BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;


var config = {
  entry: './src/js/client.js',
  output: {
    path: path.resolve(__dirname, 'src'),
    filename: 'client.min.js',
    publicPath: '/'
  },
  module: {
    rules: [
      { 
        test: /\.(js)$/, 
        loader: 'babel-loader', 
        exclude: /(node_modules\/aws-sdk|node_modules\/amazon-cognito-identity-js)/,
        query: {
          presets: ['react', 'es2015', 'stage-0'],
          plugins: ['react-html-attrs', 'transform-class-properties', 'transform-decorators-legacy']
        }
      },
      { test: /\.css$/, use: [ 'style-loader', 'css-loader' ]},
      {test:/\.json$/,loader:'json-loader'}
    ]
  },
  plugins: [/*new BundleAnalyzerPlugin({analyzerHost:"0.0.0.0"}),*/
            new webpack.IgnorePlugin(/^\.\/locale$/, [/moment$/])]
};

if (process.env.NODE_ENV === 'production') {
  config.plugins.push(
    new webpack.DefinePlugin({
      'process.env': {
        'NODE_ENV': JSON.stringify(process.env.NODE_ENV)
      }
    })
  );
}

module.exports = config;