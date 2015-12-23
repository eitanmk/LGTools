// ==UserScript==
// @name         LG graph test
// @version      0.1
// @description  Get data about game and map in order to help us plan moves
// @include      http://landgrab.net/landgrab/ViewBoard
// @include      http://landgrab.net/landgrab/RealtimeBoard
// @grant        none
// @require      https://ajax.googleapis.com/ajax/libs/jquery/2.1.4/jquery.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.8.3/underscore-min.js
// @require      https://raw.githubusercontent.com/andrewhayward/dijkstra/master/graph.js
// ==/UserScript==
/* jshint -W097 */
'use strict';

jQuery.noConflict();

var SM_GLOBALS = {
    chokePoints: null
};

function timedChunk(items, process, context, callback){
    var todo = items.concat();   //create a clone of the original
    var count = 0;
    setTimeout(function(){

        var start = +new Date();

        do {
            process.call(context, todo.shift(), count);
            count++;
        } while (todo.length > 0 && (+new Date() - start < 50));

        if (todo.length > 0){
            setTimeout(arguments.callee, 25);
        } else {
            callback(items);
        }
    }, 25);
}

var territoriesObj = window.territories;

var $button = jQuery('<div/>').addClass('control_panel_table').html([
        '<table style="padding-right: 5px; padding-left:5px" id="show_all_borders"><tr><td>',
            '<table class="button_table"><tr>',
                '<td class="button_table_left"></td>',
                '<td class="button_text">SHOW CHOKE POINTS</td>',
                '<td class="button_table_right"></td>',
            '</tr></table>',
        '</td></tr></table>'
    ].join('')).on('click', determineChokePoints);
jQuery('#control_panel_upper').append($button);


function determineChokePoints() {
    var $buttonEl = jQuery(this);
    
    if (SM_GLOBALS.chokePoints) {
        drawChokePoints(SM_GLOBALS.chokePoints);
        return;
    }
    
    $buttonEl
        .find('.button_table').removeClass('button_table').addClass('button_table_disabled').end()
        .find('.button_table_left').removeClass('button_table_left').addClass('button_table_left_disabled').end()
        .find('.button_table_right').removeClass('button_table_right').addClass('button_table_right_disabled').end()
        .off('click');

    var bordersPromise = new Promise(function (resolve, reject) {
        window.AjaxProxy.getAllBorders( (borderInfo) => resolve(borderInfo) );
    });

    bordersPromise.then( (borderInfo) => {
        var graphData = _.mapObject(borderInfo, (val, key) => {
            var retObj = {};
            _.each(val, (border) => retObj[border] = 1);
            return retObj;
        });
        
        var graph = new Graph(graphData);
        
        var territoryIdList = _.keys(territories);
        var routesList = [];
        _.each(territoryIdList, (currentId) => {
            _.each(_.without(territoryIdList, currentId), (destId) => {
                if (parseInt(currentId, 10) < parseInt(destId, 10)) {
                    routesList.push("" + currentId + "," + destId);
                } else {
                    routesList.push("" + destId + "," + currentId);
                }
            });
        });
        
        routesList = _.uniq(routesList);
        
        var shortestRoutes = {};
        var $buttonText = $buttonEl.find('.button_text');
        
        var pathCalcPromise = new Promise(function (resolve, reject) {
            console.time('paths');
            timedChunk(routesList, (route, index) => {
                $buttonText.text('' + (index + 1) + ' of ' + routesList.length);
                var parts = route.split(',');
                var start = parts[0];
                var end = parts[1];
                var shortestRoute = graph.findShortestPath(start, end);
                shortestRoutes[route] = shortestRoute;
            }, null, () => { console.timeEnd('paths'); resolve() });
        });

        pathCalcPromise.then( () => {
            var nodePathCounts = {};
            var routeKeys = _.keys(shortestRoutes);
            _.each(routeKeys, (route) => {
                var pathArr = shortestRoutes[route];
                _.each(pathArr, (node) => {
                    if (nodePathCounts[node]) {
                        nodePathCounts[node]++;
                    } else {
                        nodePathCounts[node] = 1;
                    }
                });
            });

            var nodePathCountsArray = [];
            _.each(_.keys(nodePathCounts), (key) => {
                nodePathCountsArray.push({territoryId: key, count: nodePathCounts[key]});
            });
            nodePathCountsArray.sort((a, b) => {
                if (a.count < b.count) { return -1; }
                if (a.count > b.count) { return 1; }
                return 0;
            });
            nodePathCountsArray.reverse();
            var chokePoints = _.filter(nodePathCountsArray, (obj) => obj.count > (0.1 * routeKeys.length) );

            SM_GLOBALS.chokePoints = chokePoints;
            
            drawChokePoints(chokePoints);
            
            $buttonEl
                .find('.button_table_disabled').removeClass('button_table_disabled').addClass('button_table').end()
                .find('.button_table_left_disabled').removeClass('button_table_left_disabled').addClass('button_table_left').end()
                .find('.button_table_right_disabled').removeClass('button_table_right_disabled').addClass('button_table_right').end()
                .find('.button_text').text('SHOW CHOKE POINTS')
                .on('click', determineChokePoints);
        });
    });
}

function drawChokePoints(chokePoints) {
    var mapImage = jQuery('#map_image');
    var canvas = jQuery('#m_canvas').attr('width', mapImage.attr('width')).attr('height', mapImage.attr('height'));
    var ctx = canvas.get(0).getContext('2d');

    _.each(chokePoints, (candidate) => {
        var territoryData = territoriesObj[candidate.territoryId];
        ctx.beginPath();
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#FFFFFF';
        ctx.arc(territoryData.xcoord, territoryData.ycoord, 15, 0, Math.PI * 2);
        ctx.stroke();
    });
}

