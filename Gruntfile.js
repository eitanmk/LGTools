module.exports = function (grunt) {

    var artifactPath = 'dist/lgtools.user.js';

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        rollup: {
            dist: {
                options: {
                    format: 'iife'
                },
                files: {
                    'dist/lgtools.user.js': 'gm/main.js',
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-rollup');

    grunt.registerTask('default', 'build');
    grunt.registerTask('build', ['rollup', 'prepend']);
    grunt.registerTask('prepend', function () {
        var headerTemplate = grunt.file.read('header.template.js');
        var headerText = grunt.template.process(headerTemplate, grunt.config('pkg'));
        var scriptFile = grunt.file.read(artifactPath);
        scriptFile = [headerText, scriptFile].join('\n');
        grunt.file.write(artifactPath, scriptFile);
    });
};
