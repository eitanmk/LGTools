// ==UserScript==
// @name         lg-tools
// @version      0.0.3
// @description  Enhancements to LandGrab
// @include      http://landgrab.net/landgrab/ViewBoard
// @include      http://landgrab.net/landgrab/RealtimeBoard
// @grant        none
// @require      https://ajax.googleapis.com/ajax/libs/jquery/2.1.4/jquery.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.8.3/underscore-min.js
// @require      https://raw.githubusercontent.com/eitanmk/LGTools/master/deps/cytoscape-2.5.4.js
// ==/UserScript==


(function () {
    'use strict';

    class Game {

        get players() {
            return window.players;
        }

        get territories() {
            return window.territories;
        }

        get territoryToContinentMap() {
            return window.ttcVals;
        }

        get bridgesAndWallsEnabled() {
            return window.bridgesAndWallsEnabled;
        }

        get isTeamGame() {
            return window.teamGame === true;
        }

        // perhaps make borderData private someday, using Symbol or #
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

    }

    let GAME = new Game();

    class Graph {

        async getGraphElements() {
            if (this.graphElements) {
                return this.graphElements;
            }

            var borderInfo = await GAME.getBorderData();
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
    }

    class UI_Utils {

        static mapDimensions() {
            var $mapImage = jQuery('#map_image');
            return [$mapImage.attr('width'), $mapImage.attr('height')];
        }

        static makeButton(text) {
            return jQuery(`
            <table class="button_table">
                <tr>
                    <td class="button_table_left"></td>
                    <td class="button_text">${text.toUpperCase()}</td>
                    <td class="button_table_right"></td>
                </tr>
            </table>
        `);
        }

        static makeCheckbox(id, text, checked) {
            return jQuery(`
            <div>
                <input type="checkbox" id="${id}" ${checked ? 'checked="checked"' : ''} />
                <label for="${id}">${text}</label>
            </div>
        `);
        }

        static makeDataTable(tableHeading, numCols, ...columnHeadings) {
            var table = `
            <td valign="top" style="padding-left: 5px; width: 40%">
                <table border="0" cellpadding="0" cellspacing="0" class="data_table">
                    <thead>
                        <tr><td colspan="${numCols}">${tableHeading}</td></tr>
                        <tr><td>${columnHeadings.join('</td><td>')}</td></tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </td>
        `;
            return jQuery(table).find('thead td').css('background-image', 'url(images/white_40_opac.png)').end();
        }
    }

    class GraphView {

        constructor() {
            this.$graphToggle = UI_Utils.makeCheckbox('graph_toggle', 'Toggle graph layer', false);
        }

        async init() {
            if (!this.graph) {
                var graphObj = new Graph();
                this.graphContainer = this._setupGraphContainer();
                var graphElements = await graphObj.getGraphElements();
                this.graph = this._initializeGraph(this.graphContainer, graphElements);
            }
        }

        getControl() {
            var graphViewObj = this;
            this.init().then( () => {
                graphViewObj.$graphToggle.find('input').on('click', function () {
                    if (this.checked) {
                        graphViewObj.show();
                    } else {
                        graphViewObj.hide();
                    }
                });
            });

            return this.$graphToggle;
        }

        _setupGraphContainer() {
            var [mapWidth, mapHeight] = UI_Utils.mapDimensions();

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
                .insertAfter('#m_canvas');

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
            this.graph.resize();
        }

        hide() {
            this.graphContainer.hide();
        }
    }

    let graphView = new GraphView();

    var DEBUG_ENABLED = !!0;

    function DEBUG() {
        if (DEBUG_ENABLED) console.log.apply(console, arguments);
    }

    class ChokePoints {

        constructor(view) {
            this.viewObj = view;
        }

        async getChokePoints() {
            if (this.chokePoints) {
                return this.chokePoints;
            }

            var graphObj = new Graph();

            this.borderData = await GAME.getBorderData();
            var graphElements = await graphObj.getGraphElements();
            this.graph = cytoscape({
                headless: true,
                elements: graphElements
            });
            this.chokePoints = await this._calculateChokePoints();
            return this.chokePoints;
        }

        _combinations(arr, k) {
            var i, subI, ret = [], sub,	next;
            for (i = 0; i < arr.length; i++) {
                if (k === 1) {
                    ret.push([ arr[i] ]);
                } else {
                    sub = this._combinations(arr.slice(i + 1, arr.length), k - 1);
                    for (subI = 0; subI < sub.length; subI++ ) {
                        next = sub[subI];
                        next.unshift(arr[i]);
                        ret.push(next);
                    }
                }
            }
            return ret;
        }

        _calculateChokePoints() {
            return new Promise((resolve) => {
                var chokePoints = [];
                var counter = 1;
                var territoryIds = _.keys(GAME.territories);
                var numTerritories = territoryIds.length;
                var viewObj = this.viewObj;

                var chokePointGenerator = this._generateChokePoints(territoryIds);

                function step() {
                    viewObj.updateButtonText('Calculating ' + counter + ' of ' + numTerritories);
                    counter++;
                    var genResult = chokePointGenerator.next();
                    if (genResult.value) {
                        chokePoints.push(genResult.value);
                    }
                    if (genResult.done) {
                        resolve(chokePoints);
                    } else {
                        setTimeout(step, 0);
                    }
                }

                step();
            });
        }

        *_generateChokePoints(territoryIds) {
            var numTerritories = territoryIds.length;

            for (let index = 0; index < numTerritories; ++index) {
                var terrId = territoryIds[index];
                var routes = [];
                var borders = this.borderData['' + terrId];
                var candidateContinent = GAME.territoryToContinentMap[terrId];
                DEBUG('territory', terrId, GAME.territories[terrId].name, 'continent', candidateContinent);
                DEBUG('borders', borders);
                var borderTestCombos = this._combinations(borders, 2);
                for (let c = 0, numCombos = borderTestCombos.length; c < numCombos; c++) {
                    var combo = borderTestCombos[c];
                    var root = combo[0];
                    var goal = combo[1];
                    DEBUG('current combo', root, goal);
                    DEBUG('combo continents', root, GAME.territoryToContinentMap[root], goal, GAME.territoryToContinentMap[goal]);
                    // if both the root and goal are in the same continent as candidate, we can skip this combo
                    if (GAME.territoryToContinentMap[root] === candidateContinent &&
                        GAME.territoryToContinentMap[goal] === candidateContinent) {
                        DEBUG('disqualifying b/c both neighbors are in same continent as candidate');
                        continue;
                    }

                    // if neither the root nor goal are in the candidate's continent, we can skip this combo
                    if (GAME.territoryToContinentMap[root] !== candidateContinent &&
                        GAME.territoryToContinentMap[goal] !== candidateContinent) {
                        DEBUG('disqualifying b/c both neighbors are in a different continent from candidate');
                        continue;
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
                }

                if (routes.length > 0 && _.every(routes, (route) => route.distance === 3)) {
                    DEBUG('adding choke point', terrId);
                    yield terrId;
                } else {
                    yield;
                }

            }
        }

    }

    class ChokePointsView {

        constructor() {
            this.$canvas = jQuery('<canvas>').css({
                position: 'absolute',
                top: 0,
                left: 0,
                zIndex: '2'
            }).insertAfter('#m_canvas');
            this.$chokePointsButton = UI_Utils.makeButton('show choke points');
            this.$chokePointsButtonText = this.$chokePointsButton.find('.button_text');
            this.$chokePointsToggle = UI_Utils.makeCheckbox('choke_points_toggle', 'Toggle choke points', true);
        }

        getControl() {
            var chokePointsViewObj = this;

            this.$chokePointsButton.on('click', function () {
                window.disableButton(this);
                jQuery(this).off('click');

                chokePointsViewObj.drawChokePoints().then( () => {
                    chokePointsViewObj.$chokePointsToggle.find('input').on('click', function () {
                        if (this.checked) {
                            chokePointsViewObj.drawChokePoints();
                        } else {
                            chokePointsViewObj.resetCanvas();
                        }
                    });
                    chokePointsViewObj.$chokePointsButton.replaceWith(chokePointsViewObj.$chokePointsToggle);
                });
            });

            return this.$chokePointsButton;
        }

        updateButtonText(txt) {
            this.$chokePointsButtonText.text(txt);
        }

        drawChokePoints() {
            if (!this.chokePointsObj) {
                this.chokePointsObj = new ChokePoints(this);
            }

            return this.chokePointsObj.getChokePoints().then( (chokePoints) => {
                this.resetCanvas();
                var ctx = this.$canvas.get(0).getContext('2d');

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

        resetCanvas() {
            let [mapWidth, mapHeight] = UI_Utils.mapDimensions();
            var $canvas = this.$canvas.attr('width', mapWidth).attr('height', mapHeight);
            var ctx = $canvas.get(0).getContext('2d');
            ctx.clearRect(0, 0, mapWidth, mapHeight);
        }

    }

    let chokePointsView = new ChokePointsView();

    class UI {

        static setupUI() {
            // fix huge annoyance of having attack reports always enabled by default...
            jQuery('#attack_reports_cb').trigger('click');

            let $anchorPoint = jQuery('<div id="sm_tools"></div>').insertAfter('#control_panel_upper');
            let $smToolsHeading = jQuery('<div/>').css({
                margin: '5px 3px 0 0',
                padding: '4px',
                borderTop: '1px solid #ebe585',
                borderBottom: '1px solid #ebe585',
                background: 'url(images/blue_20_opac.png) 0 0 repeat'
            }).append('<span style="color: white; font-weight: bold;">SM Tools</span>');
            let $toolsContainer = jQuery('<div/>').addClass('control_panel_table').html(
                '<table style="padding-right: 5px; padding-left:5px"><tr><td></td></tr></table>'
            );

            $anchorPoint.append($smToolsHeading);
            $anchorPoint.append($toolsContainer);

            let $controlInsertionPoint = $toolsContainer.find('table tr td').first();
            $controlInsertionPoint.append(chokePointsView.getControl());
            $controlInsertionPoint.append(graphView.getControl());
        }
    }

    class TeamData {

        drawSummaryTable() {
            if (!GAME.isTeamGame) {
                return;
            }

            let $teamSummaryTable = UI_Utils.makeDataTable('Team Summary', 4, 'Team', 'Territories', 'Troops', 'Cards');

            let $dataTables = jQuery('.data_tables_table .data_table');
            let $playerTable = $dataTables.first();
            let $teamTable = $dataTables.last();

            $playerTable.closest('.data_tables_table').attr('width', 1000);
            $playerTable.closest('td').attr('colspan', '').after($teamSummaryTable);

            var teamData = {};

            $teamTable.find('tbody tr').each(function (index, row) {
                var teamId = '' + (index + 1);
                var $cell = jQuery(row).find('td').first();
                teamData[teamId] = { bgcolor: $cell.attr('bgcolor'), color: $cell.css('color'), name: jQuery.trim($cell.text()) };
            });

            $playerTable.find('tbody tr').each(function (index, row) {
                var territoryCount = 0, troopCount = 0, cardCount = 0;
                var $row = jQuery(row);
                var $columns = $row.find('td');
                var playerName = jQuery.trim($columns.eq(1).text());
                var playerObj = _.find(_.values(GAME.players), function (obj) { return obj.name.indexOf(playerName) === 0; });
                var teamId = '' + playerObj.teamNumber;
                var $testColumn = $columns.eq(2);
                if (! $testColumn.attr('colspan')) {
                    territoryCount = parseInt(jQuery.trim($columns.eq(2).text()), 10);
                    troopCount = parseInt(jQuery.trim($columns.eq(3).text()), 10);
                    cardCount = parseInt(jQuery.trim($columns.eq(5).text()), 10);
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

            var tdBorder = 'border-top: 1px solid #787878';
            var $rowTarget = $teamSummaryTable.find('tbody');
            _.each(_.values(teamData), function (data, index) {
                $rowTarget.append(`
                <tr${index % 2 === 1 ? ' style="background-image: url(images/white_20_opac.png)"' : ''}>
                    <td style="${tdBorder}; background: ${data.bgcolor}; color: ${data.color}">${data.name}</td> 
                    <td style="${tdBorder};">${data.territories} (${Math.round( (data.territories / totalTerritories) * 10000 ) / 100}%)</td>
                    <td style="${tdBorder};">${data.troops} (${Math.round( (data.troops / totalTroops) * 10000 ) / 100}%)</td>
                    <td style="${tdBorder};">${data.cards}</td>
                </tr>
            `);
            });
        }
    }

    let teamData = new TeamData();

    jQuery.noConflict(); //needed?

    UI.setupUI();
    teamData.drawSummaryTable();

}());
