module.exports = function (grunt) {

    grunt.initConfig({
        concat: {
            dist: {
                src: [
                    'gm/header.js',
                    'gm/debug.js',
                    'gm/globals.js',
                    'gm/utils.js',
                    'gm/ui.js', 
                    'gm/graph-display.js',
                    'gm/choke-points.js',
                    'gm/team-data-table.js',
                    'gm/main.js'
                ],
                dest: 'dist/lgtools.user.js'
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-concat');

    grunt.registerTask('default', 'build');
    grunt.registerTask('build', 'concat');
};
