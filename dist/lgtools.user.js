// ==UserScript==
// @name         lg-tools
// @version      0.0.2
// @description  Enhancements to LandGrab
// @include      http://landgrab.net/landgrab/ViewBoard
// @include      http://landgrab.net/landgrab/RealtimeBoard
// @grant        none
// @require      https://ajax.googleapis.com/ajax/libs/jquery/2.1.4/jquery.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.8.3/underscore-min.js
// @require      https://raw.githubusercontent.com/eitanmk/LGTools/master/gm/deps/cytoscape-2.5.4.js
// ==/UserScript==
/* jshint -W097 */
/* jshint esnext: true */
/* globals console, jQuery, _, cytoscape */


(function () {
    'use strict';

    var Utils = {
        timedChunk: function (items, process, context, callback) {
            var todo = items.concat();   //create a clone of the original
            var count = 0;
            setTimeout(function chunk() {
                var start = +new Date();
                do {
                    process.call(context, todo.shift(), count);
                    count++;
                } while (todo.length > 0 && (+new Date() - start < 50));

                if (todo.length > 0){
                    setTimeout(chunk, 25);
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
        },

        makeUICheckbox: function (id, text, checked) {
            var checkedVal = '';
            if (checked) {
                checkedVal = ' checked="checked"';
            }

            return jQuery([
                '<div>',
                '<input type="checkbox"', checkedVal, '" id="', id, '" />',
                '<label for="', id, '">', text, '</label>',
                '</div>'
            ].join(''));
        }
    };

    var GAME = {
        players: window.players,
        territories: window.territories,
        territoryToContinentMap: window.ttcVals,
        bridgesAndWallsEnabled: window.bridgesAndWallsEnabled,
        isTeamGame: window.teamGame === true
    };

    class Graph {

        getBorderData() {
            return new Promise( (resolve) => {
                if (this.borderData) {
                    resolve(this.borderData);
                } else {
                    window.AjaxProxy.getAllBorders( (borderInfo) => {
                        this.borderData = borderInfo;
                        resolve(borderInfo);
                    });
                }
            });
        }

        _createGraphElements(borderInfo) {
            var elements = [];
            _.each(_.keys(borderInfo), (key) => {
                var territoryData = GAME.territories[key];
                // add the nodes
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
                // add the edges (directed)
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

            this.graphElements = elements;
            return this.graphElements; 
        }

        async getGraphElements() {
            if (this.graphElements) {
                return this.graphElements;
            }

            var borderInfo = await this.getBorderData();
            return this._createGraphElements(borderInfo);
        }
    }

    class GraphView {

        async init() {
            if (!this.graph) {
                var graphObj = new Graph();
                this.graphContainer = this._setupGraphContainer();
                var graphElements = await graphObj.getGraphElements();
                this.graph = this._initializeGraph(this.graphContainer, graphElements);
            }
        }

        _setupGraphContainer() {
            var $mapImage = jQuery('#map_image');
            var mapWidth = $mapImage.attr('width');
            var mapHeight = $mapImage.attr('height');

            var $container = jQuery('<div/>')
                .hide()
                .attr('id', 'sm_graph')
                .html('&nbsp')
                .css({
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: mapWidth + 'px',
                    height: mapHeight + 'px',
                    zIndex: 100
                })
                .insertAfter(jQuery('#m_canvas'));

            return $container.get(0);
        }

        _initializeGraph(containerElement, graphElements) {
            return cytoscape({
                container: containerElement,
                elements: graphElements, 
                style: [
                    {
                        selector: 'node',
                        style: {
                            'width': '10',
                            'height': '10',
                            'shape': 'rectangle'
                        }
                    },
                    {
                        selector: 'edge',
                        style: {
                            'width': 2,
                            'curve-style': 'haystack',
                            'haystack-radius': 0,
                            'line-color': '#ccc',
                            'source-arrow-shape': 'none',
                            'mid-target-arrow-shape': 'none',
                            'mid-source-arrow-shape': 'none',
                            'target-arrow-shape': 'triangle',
                            'target-arrow-fill': 'filled',
                            'target-arrow-color': '#ccc'
                        }
                    },
                ],
                layout: {
                    name: 'preset',
                    pan: false,
                    zoom: false,
                    fit: false,
                    padding: 0
                },
                pan: { x: 1, y: -18 },
                zoomingEnabled: false,
                userZoomingEnabled: false,
                panningEnabled: false,
                userPanningEnabled: false,
                autolock: true
            });
        }

        show() {
            this.graphContainer.show();
            if (!this.graphDrawn) {
                this.graph.resize();
                this.graphDrawn = true;
            }
        }

        hide() {
            this.graphContainer.hide();
        }
    }

    var DEBUG_ENABLED = !!0;

    function DEBUG() {
        if (DEBUG_ENABLED) console.log.apply(console, arguments);
    }

    class ChokePoints {

        async getChokePoints() {
            if (this.chokePoints) {
                return this.chokePoints;
            }

            var graphObj = new Graph();

            this.borderData = await graphObj.getBorderData();
            var graphElements = await graphObj.getGraphElements();
            this.graph = cytoscape({
                headless: true,
                elements: graphElements
            });
            this.chokePoints = await this._determineChokePoints();
            return this.chokePoints;
        }

        _determineChokePoints() {
            return new Promise( (resolve) => {
                var chokePoints = [];
                var numTerritories = _.keys(GAME.territories).length;
                var $buttonText = UI.$chokePointsButton.find('.button_text');

                console.time('astar');
                Utils.timedChunk(_.keys(GAME.territories), (terrId, index) => {
                    $buttonText.text('Calculating ' + index + ' of ' + numTerritories);
                    var routes = [];
                    var borders = this.borderData['' + terrId];
                    var candidateContinent = GAME.territoryToContinentMap[terrId];
                    DEBUG('territory', terrId, GAME.territories[terrId].name, 'continent', candidateContinent);
                    DEBUG('borders', borders);
                    var borderTestCombos = Utils.combinations(borders, 2);
                    _.each(borderTestCombos, (combo) => {
                        var root = combo[0];
                        var goal = combo[1];
                        DEBUG('current combo', root, goal);
                        DEBUG('combo continents', root, GAME.territoryToContinentMap[root], goal, GAME.territoryToContinentMap[goal]);
                        // if both the root and goal are in the same continent as candidate, we can skip this combo
                        if (GAME.territoryToContinentMap[root] === candidateContinent &&
                            GAME.territoryToContinentMap[goal] === candidateContinent) {
                            DEBUG('disqualifying b/c both neighbors are in same continent as candidate');
                            return;
                        }

                        // if neither the root nor goal are in the candidate's continent, we can skip this combo
                        if (GAME.territoryToContinentMap[root] !== candidateContinent &&
                            GAME.territoryToContinentMap[goal] !== candidateContinent) {
                            DEBUG('disqualifying b/c both neighbors are in a different continent from candidate');
                            return;
                        }

                        // if we're here, one of the territories in this combo should be in the candidate's continent

                        var route = this.graph.elements().aStar({
                            root: '#' + combo[0],
                            goal: '#' + combo[1],
                            weight: (edge) => {
                                if (edge.data().target == terrId) {
                                    return 2;
                                }
                                return 1;
                            },
                            directed: true
                        });
                        DEBUG(route);
                        routes.push(route);
                    });

                    if (routes.length > 0 && _.every(routes, (route) => route.distance === 3)) {
                        DEBUG('adding choke point', terrId);
                        chokePoints.push(terrId);
                    }
                }, null, () => {
                    console.timeEnd('astar');
                    resolve(chokePoints);
                });
            });
        }
    }

    class ChokePointsView {

        _resetCanvas() {
            var $mapImage = UI.$mapImage;
            var mapWidth = $mapImage.attr('width');
            var mapHeight = $mapImage.attr('height');
            var $canvas = UI.$canvas.attr('width', mapWidth).attr('height', mapHeight);
            var ctx = $canvas.get(0).getContext('2d');
            ctx.clearRect(0, 0, mapWidth, mapHeight);
        }

        drawChokePoints() {
            if (!this.chokePointsObj) {
                this.chokePointsObj = new ChokePoints();
            }

            return this.chokePointsObj.getChokePoints().then( (chokePoints) => {
                this._resetCanvas();
                var ctx = UI.$canvas.get(0).getContext('2d');

                _.each(chokePoints, (candidate) => {
                    var territoryData = GAME.territories[candidate];
                    ctx.beginPath();
                    ctx.lineWidth = 3;
                    ctx.strokeStyle = '#FFFFFF';
                    ctx.arc(territoryData.xcoord, territoryData.ycoord, 20, 0, Math.PI * 2);
                    ctx.stroke();
                });
            });
        }
    }

    var UI = {
        $mapImage: jQuery('#map_image'),
        $canvas: jQuery('#m_canvas'),
        $graphCanvas: jQuery('<div/>').hide().attr('id', 'sm_graph').insertAfter(jQuery('#m_canvas')),
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
            '<table style="padding-right: 5px; padding-left:5px"><tr><td>',
            '</td></tr></table>'
        ].join('')),

        $chokePointsButton: Utils.makeUIButton('show choke points'),
        $chokePointsToggle: Utils.makeUICheckbox('choke_points_toggle', 'Toggle choke points', true),

        $graphToggle: Utils.makeUICheckbox('graph_toggle', 'Toggle graph layer', false),

        addToToolsContainer: function ($elem) {
            UI.$toolsContainer.find('table tr td').first().append($elem);
        },

        $teamSummaryTable: jQuery([
            '<td valign="top" style="padding-left: 5px; width: 40%">',
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

    function setupUI() {
        // fix huge annoyance of having attack reports always enabled by default...
        jQuery('#attack_reports_cb').trigger('click');
        
        UI.$chokePointsButton.on('click', function () {
            window.disableButton(this);
            jQuery(this).off('click');
            var chokePointsViewObj = new ChokePointsView();
            chokePointsViewObj.drawChokePoints().then( () => {
                UI.$chokePointsToggle.find('input').on('click', function () {
                    if (this.checked) {
                        chokePointsViewObj.drawChokePoints();
                    } else {
                        chokePointsViewObj._resetCanvas();
                    }
                });
                UI.$chokePointsButton.replaceWith(UI.$chokePointsToggle);
            });
        });
        UI.addToToolsContainer(UI.$chokePointsButton);

        var graphViewObj = new GraphView();
        graphViewObj.init().then( () => {
            UI.$graphToggle.find('input').on('click', function () {
                if (this.checked) {
                    graphViewObj.show();
                } else {
                    graphViewObj.hide();
                }
            });
        });
        UI.addToToolsContainer(UI.$graphToggle);

        UI.$anchorPoint.append(UI.$smToolsHeading);
        UI.$anchorPoint.append(UI.$toolsContainer);
    }

    function createTeamDataTable() {
        if (!GAME.isTeamGame) {
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
            var playerObj = _.find(_.values(GAME.players), function (obj) { return obj.name.indexOf(playerName) === 0; });
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

        var totalTerritories = _.keys(GAME.territories).length;
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
    }

    jQuery.noConflict(); //needed?

    setupUI();
    createTeamDataTable();

}());
