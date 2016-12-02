var webpack = require('webpack');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var path = require('path');

module.exports = {
  entry: './client/app/main.ts',
  output: {
    path: path.resolve('./build/client'),
    filename: 'app.bundle.js',
    contentBase: __dirname + '/build/client/',
    publicPath: '/',
  },
  module: {
    loaders: [
      {test: /\.component\.ts$/, loader: 'ts!angular2-template'},
      {test: /\.ts$/, exclude: /\.component\.ts$/, loader: 'ts'},
      {test: /\.html$/, loader: 'raw'},
      {test: /\.css$/, loader: 'raw!postcss'},
    ]
  },
  resolve: {
    extensions: ['', '.js', '.ts', '.html', 'css']
  },
  plugins: [ 
    new HtmlWebpackPlugin({
    template:'./client/index.html'
  }),
  new webpack.DefinePlugin({
    app: {
      environment: JSON.stringify(process.env.APP_ENVIRONMENT || 'development') 
    }
  })]
};