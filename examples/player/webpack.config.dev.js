'use strict';

var webpack = require('webpack');
var baseConfig = require('./webpack.config.base');
var path = require('path');

var config = Object.create(baseConfig);

config.devtool = 'eval';
config.entry.unshift(
  'webpack-dev-server/client?http://localhost:3000',
  'webpack/hot/only-dev-server'
);

config.plugins = [
  new webpack.HotModuleReplacementPlugin(),
  new webpack.optimize.OccurenceOrderPlugin(),
  new webpack.DefinePlugin({
    'process.env.NODE_ENV': JSON.stringify('development')
  })
];

module.exports = config;
