module.exports = function(config) {
  config.set({
    frameworks: ['jasmine'],
    files: [
      {pattern: './app/specs.ts', watched: false}
    ],
    preprocessors: {
      './app/specs.ts': ''
    },
    browsers: ['Chrome']
  });
}