/**
 * Created by Moiz.Kachwala on 08-06-2016.
 */
"use strict";

const gulp = require("gulp"),
    del = require("del"),
    tsc = require("gulp-typescript"),
    sourcemaps = require('gulp-sourcemaps'),
    tslint = require('gulp-tslint'),
    concat = require('gulp-concat'),
    runSequence = require('run-sequence'),
    browserSync = require('browser-sync'),
    reload = browserSync.reload,
    nodemon = require('gulp-nodemon'),
    webpack = require('gulp-webpack'),
    exec = require('child_process').exec,
    path = require('path');

/**
 * Remove build directory.
 */
gulp.task('clean', (cb) => {
    return del(["dist"], cb);
});

gulp.task('compile-ts', ['compile:server', 'compile:client']);

/**
 * Compile TypeScript sources and create sourcemaps in build directory.
 */
gulp.task("compile:client", () => {
    return gulp.src('client/**')
        .pipe(webpack( require('./webpack.config.js') ))
        .pipe(gulp.dest('./build/client'));
});


/**
 * Compile TypeScript sources and create sourcemaps in build directory.
 */
var tsProject = tsc.createProject('tsconfig.json');
gulp.task("compile:server", () => {
   
    var tsResult = gulp.src(['./**/*.ts', '!./node_modules/**', '!./client/**', '!./build/**'])
        .pipe(sourcemaps.init())
        .pipe(tsProject());
    return tsResult.js
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('./build'));
});

gulp.task('reload', reload);

/**
 * Watch for changes in TypeScript, HTML and CSS files.
 */
gulp.task('watch', function () {
    gulp.watch(["./**/*.ts", "!./client/**"], ['compile:server']).on('change', function (e) {
        console.log('TypeScript file ' + e.path + ' has been changed. Compiling.');
    });

    gulp.watch(["./client/**/*.ts"]).on('change', function (e) {
        console.log('TypeScript file ' + e.path + ' has been changed. Compiling.');
        runSequence('compile:client', 'reload')
    });
});

gulp.task('develop', ['compile-ts'], function (cb) {
  runSequence(['watch']);
  var called = false;
  return nodemon({
    script: 'build/server.js'
    ,ignore: [
      'gulpfile.js',
      'node_modules/',
      'build/client/**',
      'ignored.js'
    ]
    , watch: 'build'
    , env: { 'NODE_ENV': 'development' }
  })
  .on('start', function () {
    if (!called) {
      called = true;
      cb();
    }
  })
  .on('restart', function () {
    setTimeout(function () {
      reload({ stream: false });
    }, 1000);
    console.log('restarted!');
  });
});

gulp.task('browser-sync', ['develop'], function() {
  browserSync({
    proxy: "localhost:3000",  // local node app address
    port: 3001,  // use *different* port than above
    notify: true
  });
});


gulp.task('default', ['browser-sync'], function () {
});
