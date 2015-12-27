// ==UserScript==
// @name         LG graph test
// @version      0.1
// @description  Get data about game and map in order to help us plan moves
// @include      http://landgrab.net/landgrab/ViewBoard
// @include      http://landgrab.net/landgrab/RealtimeBoard
// @grant        none
// @require      https://ajax.googleapis.com/ajax/libs/jquery/2.1.4/jquery.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.8.3/underscore-min.js
// @require      https://raw.githubusercontent.com/cytoscape/cytoscape.js/master/dist/cytoscape.min.js
// ==/UserScript==
/* jshint -W097 */
/* jshint esnext: true */
/* globals jQuery, _, cytoscape */
'use strict';

jQuery.noConflict();

(function () {

    var GLOBALS = {
        territories: window.territories,
        borderData: null,
        borderGraph: null,
        chokePoints: null
    };

    var Utils = {
        timedChunk: function (items, process, context, callback) {
            var todo = items.concat();   //create a clone of the original
            var count = 0;
            setTimeout(function (){
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

        combinations: function combinations(arr, k) {
            var i, subI, ret = [], sub,	next;
            for (i = 0; i < arr.length; i++) {
                if (k === 1) {
                    ret.push([ arr[i] ]);
                } else {
                    sub = combinations(arr.slice(i + 1, arr.length), k - 1);
                    for (subI = 0; subI < sub.length; subI++ ) {
                        next = sub[subI];
                        next.unshift(arr[i]);
                        ret.push(next);
                    }
                }
            }
            return ret;
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

    var initializeGraphs = new Promise( (resolve, reject) => {
        if (GLOBALS.borderData !== null) {
            resolve(GLOBALS.borderData);
        } else {
            window.AjaxProxy.getAllBorders( (borderInfo) => {
                GLOBALS.borderData = borderInfo;
                resolve(borderInfo);
            });
        }
    }).then((borderInfo) => {
        var elements = [];
        _.each(_.keys(borderInfo), (key) => {
            var territoryData = GLOBALS.territories[key];
            elements.push({
                data: {
                    id: key,
                    name: territoryData.name
                },
                position: {
                    x: territoryData.xcoord,
                    y: territoryData.ycoord
                }
            });
            _.each(borderInfo[key], (border) => {
                elements.push({
                    data: {
                        id: key + ',' + border,
                        source: key,
                        target: '' + border
                    }
                });
            });
        });

        GLOBALS.borderGraph = cytoscape({
            headless: true,
            elements: elements
        });
    });

    var determineChokePoints = function () {

        if (GLOBALS.chokePoints) {
            drawChokePoints(GLOBALS.chokePoints);
            return;
        }

        window.disableButton(UI.$chokePointsButton.get(0));
        UI.$chokePointsButton.off('click');

        initializeGraphs.then( () => {
            return new Promise( (resolve, reject) => {
                var shortestRoutes = {};
                console.time('dijkstra');
                var numTerritories = _.keys(GLOBALS.territories).length;
                Utils.timedChunk(_.keys(GLOBALS.territories), (terrId, index) => {
                    UI.$chokePointsButton.find('.button_text').text('Calculating ' + index + ' of ' + numTerritories);
                    shortestRoutes[terrId] = GLOBALS.borderGraph.elements().dijkstra({root: '#' + terrId, directed: true});
                }, null, () => {
                    console.timeEnd('dijkstra');
                    resolve(shortestRoutes);
                });
            });
        }).then( (shortestRoutes) => {
            var territoryIdList = _.keys(GLOBALS.territories);
            var routesList = Utils.combinations(territoryIdList, 2);
            var nodePathCounts = {};
            var numRoutes = routesList.length;
            return new Promise( (resolve, reject) => {
                console.time('routes');
                Utils.timedChunk(routesList, (route, index) => {
                    UI.$chokePointsButton.find('.button_text').text('Analyzing ' + (index + 1) + ' of ' + numRoutes);

                    var root = route[0];
                    var target = route[1];
                    var routesObj = shortestRoutes[root];
                    var pathToTarget = routesObj.pathTo('#' + target);
                    pathToTarget.forEach((elem) => {
                        if (elem.isNode()) {
                            var id = elem.id();
                            if (nodePathCounts[id]) {
                                nodePathCounts[id]++;
                            } else {
                                nodePathCounts[id] = 1;
                            }
                        }
                    });
                }, null, () => {
                    console.timeEnd('routes');
                    resolve({ shortestRoutes, routesList, nodePathCounts });
                });
            });
        }).then( (pathData) => {
            var routesList = pathData.routesList;
            var shortestRoutes = pathData.shortestRoutes;
            var nodePathCounts = pathData.nodePathCounts;

            var numTerritories = _.keys(GLOBALS.territories).length;
            var numRoutes = (numTerritories * (numTerritories - 1)) / 2;

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
            var chokePoints = _.filter(nodePathCountsArray, (obj) => obj.count > (0.1 * numRoutes) );

            GLOBALS.chokePoints = chokePoints;

            drawChokePoints(chokePoints);

            window.enableButton(UI.$chokePointsButton.get(0));
            UI.$chokePointsButton
                .find('.button_text').text('SHOW CHOKE POINTS')
                .on('click', determineChokePoints);

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
    };

    var setupUI = function () {
        UI.$chokePointsButton.on('click', determineChokePoints);

        UI.$toolsContainer.find('table tr td').append(UI.$chokePointsButton);

        UI.$anchorPoint.append(UI.$toolsContainer);
    };

    var main = function () {
        setupUI();
    };

    main();

})(); 

