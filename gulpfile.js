const gulp = require('gulp');
const scss = require('gulp-sass')(require('sass'));
const del = require('del');
const babel = require('gulp-babel');
const uglify = require('gulp-uglify');
const concat = require('gulp-concat');
const rename = require('gulp-rename');
const sourcemaps = require('gulp-sourcemaps');
const autoprefixer = require('gulp-autoprefixer');
const imagemin = require('gulp-imagemin');
const newer = require('gulp-newer');
const htmlmin = require('gulp-htmlmin');
const fileinclude = require('gulp-file-include');
const plumber = require('gulp-plumber');
const fonter = require('gulp-fonter');
const ttf2woff2 = require('gulp-ttf2woff2');
const browserSync = require('browser-sync').create();

const path = {
  style: {
    src: 'src/scss/**/*.scss',
    dest: 'dist/css/',
  },
  html: {
    src: 'src/html/**/*.html',
    htmlmin: 'src/html/index.html',
    dest: 'dist/',
  },
  scripts: {
    src: 'src/js/**/*.js',
    dest: 'dist/js/',
  },
  images: {
    src: 'src/img/**/*.{jpeg,jpg,webp,png,svg}',
    dest: 'dist/img'
  },
  font: {
    src: 'src/font/*.{eot,ttf,otf,otc,ttc,woff,woff2,svg}',
    watch: 'src/font/**/*.{eot,ttf,otf,otc,ttc,woff,woff2,svg}',
    dest: 'dist/font'
  },
}

function clean() {
  return del(['dist/*', '!dist/img']);
}

function html() {
  return gulp.src(path.html.htmlmin)
  .pipe(plumber())
  .pipe(fileinclude({
    prefix: '@@',
    basepath: '@file'
  }))
  .pipe(gulp.dest('src'))
  .pipe(htmlmin({ collapseWhitespace: true }))
  .pipe(gulp.dest(path.html.dest));
}

function fonts() {
  return gulp.src(path.font.src, {sourcemaps: true})
    .pipe(plumber())
    .pipe(newer(path.font.dest))
    .pipe(fonter({
      formats: ['woff2', 'woff', 'ttf'],
    }))
    .pipe(gulp.dest(path.font.dest))
    .pipe(ttf2woff2())
    .pipe(gulp.dest(path.font.dest));
}

function img() {
  return gulp.src(path.images.src)
  .pipe(newer(path.images.dest))
		.pipe(imagemin([
      imagemin.gifsicle({interlaced: true}),
	    imagemin.mozjpeg({progressive: true}),
	    imagemin.optipng({optimizationLevel: 5}),
	    imagemin.svgo({
        plugins: [
          {removeViewBox: true},
          {cleanupIDs: false}
        ]
	    })
    ]))
		.pipe(gulp.dest(path.images.dest))
  }

function scripts() {
  return gulp.src(path.scripts.src, {
    sourcemaps: true
  })
  .pipe(plumber())
  .pipe(sourcemaps.init())
  .pipe(babel({
    presets: ['@babel/env']
  }))
  .pipe(uglify())
  .pipe(concat('main.min.js'))
  .pipe(sourcemaps.write('.'))
  .pipe(gulp.dest(path.scripts.dest))
  .pipe(browserSync.stream());
}

function styles() {
  return gulp.src(path.style.src)
    .pipe(plumber())
    .pipe(sourcemaps.init())
    .pipe(scss({outputStyle: 'compressed'}).on('error', scss.logError))
    .pipe(autoprefixer({
			cascade: false
		}))
    .pipe(rename({
      basename: 'main',
      suffix: '.min',
    }))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(path.style.dest))
    .pipe(browserSync.stream());
}

function watch() {
  browserSync.init({
    server: {
      baseDir: './dist/'
    }
  })
  gulp.watch(path.html.src).on('change', browserSync.reload)
  gulp.watch(path.html.src, html)
  gulp.watch(path.style.src, styles)
  gulp.watch(path.font.watch, fonts)
  gulp.watch(path.scripts.src, scripts)
  gulp.watch(path.images.src, img)
}

const build = gulp.series(clean, html, gulp.parallel(styles, scripts, img, fonts), watch);

exports.clean = clean;
exports.fonts = fonts;
exports.styles = styles;
exports.scripts = scripts;
exports.watch = watch;
exports.img = img;
exports.html = html;
exports.build = build;
exports.default = build;