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

(function () {

    var GLOBALS = {
        territories: window.territories,
        chokePoints: null
    };

    var Utils = {
        timedChunk: function (items, process, context, callback) {
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
        },

        makeUIButton: function (text) {
            return jQuery([
                '<table class="button_table"><tr>',
                    '<td class="button_table_left"></td>',
                    '<td class="button_text">', text.toUpperCase(), '</td>',
                    '<td class="button_table_right"></td>',
                '</tr></table>'
            ].join(''));
        }
    };

    var UI = {
        $mapImage: jQuery('#map_image'),
        $canvas: jQuery('#m_canvas'),

        $anchorPoint: jQuery('#control_panel_upper'),

        $toolsContainer: jQuery('<div/>').addClass('control_panel_table').html([
            '<table style="padding-right: 5px; padding-left:5px" id="sm_tools"><tr><td>',
            '</td></tr></table>'
        ].join('')),

        $chokePointsButton: Utils.makeUIButton('show choke points')
    };

    var determineChokePoints = function () {

        if (GLOBALS.chokePoints) {
            drawChokePoints(GLOBALS.chokePoints);
            return;
        }

        window.disableButton(UI.$chokePointsButton.get(0));
        UI.$chokePointsButton.off('click');

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
            var $buttonText = UI.$chokePointsButton.find('.button_text');

            var pathCalcPromise = new Promise(function (resolve, reject) {
                console.time('paths');
                Utils.timedChunk(routesList, (route, index) => {
                    $buttonText.text('' + (index + 1) + ' of ' + routesList.length);
                    var parts = route.split(',');
                    var start = parts[0];
                    var end = parts[1];
                    var shortestRoute = graph.findShortestPath(start, end);
                    shortestRoutes[route] = shortestRoute;
                }, null, () => { console.timeEnd('paths'); resolve(); });
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

                GLOBALS.chokePoints = chokePoints;

                drawChokePoints(chokePoints);

                window.enableButton(UI.$chokePointsButton.get(0));
                UI.$chokePointsButton
                    .find('.button_text').text('SHOW CHOKE POINTS')
                    .on('click', determineChokePoints);
            });
        });
    };

    var drawChokePoints = function (chokePoints) {
        var $mapImage = UI.$mapImage;
        var $canvas = UI.$canvas.attr('width', $mapImage.attr('width')).attr('height', $mapImage.attr('height'));
        var ctx = $canvas.get(0).getContext('2d');

        _.each(chokePoints, (candidate) => {
            var territoryData = GLOBALS.territories[candidate.territoryId];
            ctx.beginPath();
            ctx.lineWidth = 3;
            ctx.strokeStyle = '#FFFFFF';
            ctx.arc(territoryData.xcoord, territoryData.ycoord, 15, 0, Math.PI * 2);
            ctx.stroke();
        });
    }

    var setupUI = function () {
        UI.$chokePointsButton.on('click', determineChokePoints);

        UI.$toolsContainer.find('table tr td').append(UI.$chokePointsButton);

        UI.$anchorPoint.append(UI.$toolsContainer);
    };

    setupUI();

})(); 

