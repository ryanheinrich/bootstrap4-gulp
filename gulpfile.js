var gulp = require('gulp'),
plumber = require('gulp-plumber'),
rename = require('gulp-rename');
var uncss = require('gulp-uncss');
var autoprefixer = require('autoprefixer');
var postcss = require('gulp-postcss');
var concat = require('gulp-concat');
var jshint = require('gulp-jshint');
var uglify = require('gulp-uglify');
var imagemin = require('gulp-imagemin');
var nano = require('gulp-cssnano');
var sass = require('gulp-sass');
var clean = require('gulp-clean');
var browserSync = require('browser-sync');
var sequence = require('run-sequence');
var htmlmin = require('gulp-htmlmin');
var inject = require('gulp-inject');
var series = require('stream-series');
var framework = 'bootstrap';
var PATHS = {
  sass: ['./src/styles/sass/**/*.scss'],
  javascript: [
    'dist/js/**/*.js',
  ],
  css: [
    'dist/css/*.css',
  ],
  assets: [
    'src/assets/**/*',
  ]
};

// Delete the "dist" folder
// This happens every time a build starts
gulp.task('clean', function() {
  return gulp.src('dist', {
    read: false
  })
  .pipe(clean({
    force: true
  }));
});

// Copy files out of the assets folder
gulp.task('copy', function(done) {
  // ASSETS
  gulp.src(PATHS.assets)
    .pipe(gulp.dest('dist/assets'))
  // SCRIPTS
  gulp.src('src/scripts/vendor/*.js')
    .pipe(gulp.dest('dist/js'))
  // HTML
  gulp.src('src/*.html')
    .pipe(gulp.dest('dist'))
  done();
});


// Optimize images
gulp.task('images', function() {
  return gulp.src('src/images/**/*')
    .pipe(imagemin({optimizationLevel: 4,progressive: true,interlaced: true}))
    .pipe(gulp.dest('dist/images'));
});

// Compile SASS files into main.css
gulp.task('styles', function() {
  return gulp.src(['src/styles/sass/main.scss'])
  .pipe(plumber({
    errorHandler: function(error) {
      console.log(error.message);
      this.emit('end');
    }
  }))
  .pipe(sass({includePaths: require('node-bourbon').includePaths}))
  .pipe(postcss([autoprefixer({browsers: ['last 2 versions']})]))
  .pipe(uncss({html: ['src/*.html']}))
  .pipe(gulp.dest('dist/css'))

  .pipe(rename({suffix: '.min'}))
  .pipe(nano())
  .pipe(gulp.dest('dist/css'))
  .pipe(browserSync.reload({stream: true}))

});

// compile scripts, concatenate & minify them
gulp.task('scripts', function(done) {
  var custom = gulp.src('src/scripts/custom.js')
  .pipe(plumber({
    errorHandler: function(error) {
      console.log(error.message);
      this.emit('end');
    }
  }))
  .pipe(jshint())
  .pipe(jshint.reporter('jshint-stylish'))
  .pipe(concat('custom.js'))
  .pipe(gulp.dest('dist/js/'))
  .pipe(rename({
    suffix: '.min'
  }))
  .pipe(uglify())
  .pipe(gulp.dest('dist/js/'))
  .pipe(browserSync.reload({
    stream: true
  }))
  done();
});


// Minifies html (removes white space & comments)
gulp.task('html', function() {
  return gulp.src('dist/*.html')
  .pipe(htmlmin({collapseWhitespace: true}))
  .pipe(gulp.dest('dist'))
});

// Our Build task for everything
gulp.task('build', ['clean'], function(done) {
  sequence('copy', ['scripts', 'images' ], 'injection', 'html', 'browser-sync', done);
});

gulp.task('browser-sync', function() {
  return browserSync({server: {baseDir: "dist"}});
});

gulp.task('reload', function(){
  browserSync.reload();
});

gulp.task('bs-reload', function(done) {
  sequence('copy', 'injection','reload',done);
});
/*
index injects any css or js files located in the distribution folder
Replace the css tag for the style.css with the inject:css command below
<!-- inject:css -->
<!-- endinject -->
*/
gulp.task('injection',['styles'], function() {
  var target = gulp.src(['dist/*.html']);
  // It's not necessary to read the files (will speed up things), we're only after their paths:
  // var vendorSrc = gulp.src(['dist/css/vendor/' + framework + '.min.css'], { read: false});
  var mainSrc = gulp.src(['dist/css/main.css'], {read: false});
  var jsSrc = gulp.src(['src/scripts/*.js'], {read: false});

  return target.pipe(inject(series( mainSrc, jsSrc), {addRootSlash: false,ignorePath: 'dist'}))
  .pipe(gulp.dest('dist'))
  .pipe(browserSync.reload({
    stream: true
  }))



  /*
  return target.pipe(inject(sources, {
  // Do not add a root slash to the beginning of the path
  addRootSlash: false,
  // Remove the `public` from the path when doing the injection
  ignorePath: 'dist'
}))
.pipe(gulp.dest('./dist'));*/
});
gulp.task('uncss', function() {
  return gulp.src([
    'dist/css/**/*.css'
  ])
  .pipe(uncss({
    html: ['dist/*.html']
  }))
  .pipe(gulp.dest('dist/uncssED/'))
});

gulp.task('default', ['build'], function() {
  gulp.watch(PATHS.assets, ['copy']);
  gulp.watch(["src/styles/sass/**/*.scss"], ['styles']);
  gulp.watch(["src/scripts/**/*.js"], ['scripts']);
  gulp.watch(['src/images/**/*'], ['images']);
  gulp.watch(['src/*.html'], ['bs-reload']);
});
