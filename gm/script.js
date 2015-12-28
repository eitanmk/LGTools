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
        players: window.players,
        territories: window.territories,
        isTeamGame: window.teamGame === true,
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
        $playerTable: jQuery('.data_tables_table .data_table').first(),
        $teamTable: jQuery('.data_tables_table .data_table').last(),

        $anchorPoint: jQuery('<div id="sm_tools"></div>').insertAfter('#control_panel_upper'),

        $smToolsHeading: jQuery('<div/>').css({
            margin: '5px 3px 0 0',
            padding: '4px',
            borderTop: '1px solid #ebe585',
            borderBottom: '1px solid #ebe585',
            background: 'url(images/blue_20_opac.png) 0 0 repeat'
        }).append('<span style="color: white; font-weight: bold;">SM Tools</span>'),

        $toolsContainer: jQuery('<div/>').addClass('control_panel_table').html([
            '<table style="padding-right: 5px; padding-left:5px" id="sm_tools"><tr><td>',
            '</td></tr></table>'
        ].join('')),

        $chokePointsButton: Utils.makeUIButton('show choke points'),
        $chokePointsToggle: jQuery([
            '<input type="checkbox" checked="checked" id="choke_points_toggle" />',
            '<label for="choke_points_toggle">Toggle choke points</label>'
        ].join('')),

        addToToolsContainer: function ($elem) {
            UI.$toolsContainer.find('table tr td').append($elem);
        },

        $teamSummaryTable: jQuery([
            '<td valign="top" style="padding-left: 5px">',
            '<table border="0" cellpadding="0" cellspacing="0" class="data_table">',
            '<thead>',
            '<tr><td colspan="4">Team Summary</td></tr>',
            '<tr><td>Team</td><td>Territories</td><td>Troops</td><td>Cards</td></tr>',
            '</thead>',
            '<tbody></tbody>',
            '</table>',
            '</td>'
        ].join('')).find('thead td').css('background-image', 'url(images/white_40_opac.png)').end()
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

            UI.$chokePointsButton.remove();
            UI.$chokePointsToggle.filter('input').on('click', function () {
                if (this.checked) {
                    drawChokePoints(GLOBALS.chokePoints);
                } else {
                    resetCanvas();
                }
            });
            UI.addToToolsContainer(UI.$chokePointsToggle);

        });
    };

    var resetCanvas = function () {
        var $mapImage = UI.$mapImage;
        var mapWidth = $mapImage.attr('width');
        var mapHeight = $mapImage.attr('height');
        var $canvas = UI.$canvas.attr('width', mapWidth).attr('height', mapHeight);
        var ctx = $canvas.get(0).getContext('2d');
        ctx.clearRect(0, 0, mapWidth, mapHeight);
    };

    var drawChokePoints = function (chokePoints) {
        resetCanvas();
        var ctx = UI.$canvas.get(0).getContext('2d');

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

        UI.addToToolsContainer(UI.$chokePointsButton);

        UI.$anchorPoint.append(UI.$smToolsHeading);
        UI.$anchorPoint.append(UI.$toolsContainer);
    };

    var createTeamDataTable = function () {
        if (!GLOBALS.isTeamGame) {
            return;
        }

        UI.$playerTable.closest('.data_tables_table').attr('width', 1000);
        UI.$playerTable.closest('td').attr('colspan', '').after(UI.$teamSummaryTable);

        var teamData = {};

        UI.$teamTable.find('tbody tr').each(function (index, row) {
            var teamId = '' + (index + 1);
            var $cell = jQuery(row).find('td').first();
            teamData[teamId] = { bgcolor: $cell.attr('bgcolor'), color: $cell.css('color'), name: jQuery.trim($cell.text()) };
        });

        UI.$playerTable.find('tbody tr').each(function (index, row) {
            var territoryCount = 0, troopCount = 0, cardCount = 0;
            var playerName = jQuery.trim(jQuery(row).find('td').eq(1).text());
            var playerObj = _.find(_.values(GLOBALS.players), function (obj) { return obj.name.indexOf(playerName) === 0; });
            var teamId = '' + playerObj.teamNumber;
            var $testColumn = jQuery(row).find('td').eq(2);
            if (! $testColumn.attr('colspan')) {
                territoryCount = parseInt(jQuery.trim(jQuery(row).find('td').eq(2).text()), 10);
                troopCount = parseInt(jQuery.trim(jQuery(row).find('td').eq(3).text()), 10);
                cardCount = parseInt(jQuery.trim(jQuery(row).find('td').eq(5).text()), 10);
            }

            var teamObj = teamData[teamId];
            if (teamObj.territories) {
                teamObj.territories += territoryCount;
            } else {
                teamObj.territories = territoryCount;
            }

            if (teamObj.troops) {
                teamObj.troops += troopCount;
            } else {
                teamObj.troops = troopCount;
            }

            if (teamObj.cards) {
                teamObj.cards += cardCount;
            } else {
                teamObj.cards = cardCount;
            }
        });

        var totalTerritories = _.keys(GLOBALS.territories).length;
        var totalTroops = _.reduce(_.values(teamData), function (memo, data) { return memo + data.troops; }, 0);

        var $rowTarget = UI.$teamSummaryTable.find('tbody');
        _.each(_.values(teamData), function (data, index) {
            var rowBackground = index % 2 === 1 ? ' style="background-image: url(images/white_20_opac.png)"' : '';
            $rowTarget.append([
                '<tr', rowBackground, '>',
                '<td style="border-top: 1px solid #787878; background: ', data.bgcolor, '; color: ', data.color, '">', data.name, '</td>',
                '<td style="border-top: 1px solid #787878;">', data.territories, ' (', Math.round( (data.territories / totalTerritories) * 10000) / 100, '%)</td>',
                '<td style="border-top: 1px solid #787878;">', data.troops, ' (', Math.round( (data.troops / totalTroops) * 10000) / 100, '%)</td>',
                '<td style="border-top: 1px solid #787878;">', data.cards, '</td>',
                '</tr>'
            ].join(''));
        });
    };

    var main = function () {
        setupUI();
        createTeamDataTable();
    };

    main();

})(); 

