module.exports = function(config) {

  config.set({
    //basePath: '',
    frameworks: ['jasmine'],
    files: [
      {pattern: './client/specs.ts', watched: false}
    ],
    preprocessors: {
      './client/specs.ts': ['webpack']
    },
    webpack: {
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
      }
    },
    webpackMiddleware: {
      stats: 'errors-only'
    },
    browsers: ['Chrome']
  });
}