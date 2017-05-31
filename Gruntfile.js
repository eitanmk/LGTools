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
                    'dist/lgtools.user.js': 'src/main.js',
                }
            }
        },
        eslint: {
            options: {
                configFile: '.eslintrc.json'
            },
            target: ['src/*.js']
        }
    });

    grunt.loadNpmTasks('grunt-rollup');
    grunt.loadNpmTasks('grunt-eslint');

    grunt.registerTask('lint', 'eslint');
    grunt.registerTask('default', 'build');
    grunt.registerTask('build', ['lint', 'rollup', 'prepend']);
    grunt.registerTask('prepend', function () {
        var headerTemplate = grunt.file.read('header.template.js');
        var headerText = grunt.template.process(headerTemplate, grunt.config('pkg'));
        var scriptFile = grunt.file.read(artifactPath);
        scriptFile = [headerText, scriptFile].join('\n');
        grunt.file.write(artifactPath, scriptFile);
    });
};
