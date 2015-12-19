var path = require('path');
var HtmlwebpackPlugin = require('html-webpack-plugin');
var webpack = require('webpack');
var merge = require('webpack-merge');
var stylelint = require('stylelint');
var Clean = require('clean-webpack-plugin');
var ExtractTextPlugin = require('extract-text-webpack-plugin');

// Load *package.json* so we can use `dependencies` from there
var pkg = require('./package.json');

const TARGET = process.env.npm_lifecycle_event;
const PATHS = {
  app: path.join(__dirname, 'app'),
  build: path.join(__dirname, 'build'),
  test: path.join(__dirname, 'tests')
};

process.env.BABEL_ENV = TARGET;

var common = {
  entry: PATHS.app,
  resolve: {
    extensions: ['', '.js', '.jsx']
  },
  module: {
    preLoaders: [
      {
      test: /\.jsx?$/,
      loaders: ['eslint', 'jscs'],
      include: PATHS.app
    },
      {
        test: /\.css$/,
        loaders: ['postcss'],
        include: PATHS.app
      }
    ],
    loaders: [
      {
        test: /\.jsx?$/,
        loaders: ['babel'],
        include: PATHS.app
      }
    ]
  },
  postcss: function() {
    return [stylelint({
      rules: {
        'color-hex-case': 'lower'
      }
    })]
  },
  plugins: [
    new HtmlwebpackPlugin({
      title: 'Kanban app'
    })
  ]
};

if(TARGET === 'start' || !TARGET) {
  module.exports = merge(common, {
    devtool: 'eval-source-map',
    devServer: {
      historyApiFallback: true,
      hot: true,
      inline: true,
      progress: true,

      // display only errors to reduce the amount of output
      stats: 'errors-only',

      // parse host and port from env so this is easy
      // to customize
      host: process.env.HOST,
      port: process.env.PORT
    },
    module: {
      loaders: [
        {
          test: /\.css$/,
          loaders: ['style', 'css'],
          include: PATHS.app
        }
      ]
    },
    plugins: [
      new webpack.HotModuleReplacementPlugin()
    ]
  });
}
if(TARGET === 'build' || TARGET === 'stats') {
  module.exports = merge(common, {
    // Define entry points needed for splitting
    entry: {
      app: PATHS.app,
      vendor: Object.keys(pkg.dependencies).filter(function(v) {
        return v !== 'alt-utils';
      })
    },
    output: {
      path: PATHS.build,
      filename: '[name].[chunkhash].js',
      chunkFilename: '[chunkhash].js'
    },
    devtool: 'source-map',
    module: {
      loaders: [
        {
          test: /\.css$/,
          loader: ExtractTextPlugin.extract('style', 'css'),
          include: PATHS.app
        }
      ]
    },
    plugins: [
      new Clean([PATHS.build]),
      // Extract vendor and manifest files
      new ExtractTextPlugin('styles.[chunkhash].css'),
      new webpack.optimize.CommonsChunkPlugin({
        names: ['vendor', 'manifest']
      }),
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify('production')
      }),
      new webpack.optimize.UglifyJsPlugin({
        compress : {
          warnings: false
        }
      })
    ]
  });
}
if(TARGET === 'test' || TARGET === 'tdd') {
  module.exports = merge(common, {
    entry: {}, // karma will set this
    output: {}, // and this
    devtool: 'inline-source-map',
    resolve: {
      alias: {
        'app': PATHS.app
      }
    },
    module: {
      preLoaders: [
        {
          test: /\.jsx?$/,
          loaders: ['isparta-instrumenter'],
          include: PATHS.app
        }
      ],
      loaders: [
        {
          test: /\.jsx?$/,
          loaders: ['babel'],
          include: PATHS.test
        }
      ]
    }
  });
}
