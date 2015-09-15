'use strict';

var path = require('path');
var webpack = require('webpack');

module.exports = {
  entry: [
    './index'
  ],
  module: {
    loaders: [{
      test: /\.jsx?$/,
      loaders: ['react-hot', 'babel'],
      exclude: /node_modules/
    }, {
      test: /\.scss?$/,
      loaders: ['style', 'css', 'autoprefixer-loader?browsers=last 2 versions', 'sass'],
      include: __dirname
    }]
  },
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'bundle.js',
    publicPath: '/dist/',
    library: 'bumps',
    libraryTarget: 'umd'
  },
  resolve: {
    extensions: ['', '.js', '.jsx']
  }
};

var bumpsSrc = path.join(__dirname, '..', '..', 'src');
var bumpsNodeModules = path.join(__dirname, '..', '..', 'node_modules');
var fs = require('fs');

if (fs.existsSync(bumpsSrc) && fs.existsSync(bumpsNodeModules)) {
  module.exports.resolve.alias = { 'bumps': bumpsSrc };
}
