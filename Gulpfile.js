var gulp = require('gulp');
var sass = require('gulp-sass');
var concatCss = require('gulp-concat-css');
var minifyCss = require('gulp-minify-css');

gulp.task('styles', function() {
    gulp.src('sass/**/*.scss')
        .pipe(sass().on('error', sass.logError))
	    //.pipe(concatCss("app.css").on('error', sass.logError))
	    .pipe(minifyCss({keepSpecialComments : 0}).on('error', sass.logError))
	    .pipe(gulp.dest('./dist/'));
});

gulp.task('default',function() {
    gulp.watch('sass/**/*.scss',['styles']);
});