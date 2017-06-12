import { GAME } from './game.js';
import { EliminationPath } from './elimination-path.js';
import { UI_Utils } from './ui-utils.js';

class EliminationPathView {

    constructor() {
        this.$eliminationPathButton = UI_Utils.makeButton('find elimination path');
        this.$eliminationPathButtonText = this.$eliminationPathButton.find('.button_text');
    }

    getControl() {
        var elimPathObj = this;

        let clickHandler = function () {
            if (elimPathObj.$graphContainer) {
                elimPathObj.$graphContainer.remove();
            }
            window.disableButton(this);
            let $el = jQuery(this);
            $el.off('click');
            let originalText = elimPathObj.$eliminationPathButtonText.text();
            elimPathObj.$eliminationPathButtonText.text('Select starting territory...');
            GAME.receiveTerritoryClick(elimPathObj.showHamiltonianPath.bind(elimPathObj))
                .then( () => {
                    window.enableButton(this);
                    $el.on('click', clickHandler);
                    elimPathObj.$eliminationPathButtonText.text(originalText);
                })
                .catch( (ex) => {
                    GAME.showPopup(ex.message);
                    window.enableButton(this);
                    $el.on('click', clickHandler);
                    elimPathObj.$eliminationPathButtonText.text(originalText);
                });
        };

        this.$eliminationPathButton.on('click', clickHandler);

        return this.$eliminationPathButton;
    }

    async showHamiltonianPath(territoryId, territoryName, ownerId) {
        let eliminationPathObj = new EliminationPath(null);
        let path = await eliminationPathObj.getEliminationPath(ownerId, territoryId);

        if (path.length > 0) {
            this.$graphContainer = this._setupGraphContainer();
            let graphElements = this._getGraphElements(path);
            this.routeGraph = this._initializeGraph(this.$graphContainer.get(0), graphElements);
            this.$graphContainer.show();
            this.routeGraph.resize();
        } else {
            GAME.showPopup('No elimination path found.');
        }
    }

    _setupGraphContainer() {
        var [mapWidth, mapHeight] = UI_Utils.mapDimensions();

        var $container = jQuery('<div/>')
            .hide()
            .attr('id', 'elim_path_graph')
            .html('&nbsp')
            .css({
                position: 'absolute',
                top: 0,
                left: 0,
                width: mapWidth + 'px',
                height: mapHeight + 'px',
                zIndex: 1
            })
            .insertAfter('#m_canvas');

        return $container;
    }

    _getGraphElements(path) {
        let elements = [];
        for (let i = 0, len = path.length; i < len; ++i) {
            let terrId = path[i];
            let territoryData = GAME.territories[terrId];
            elements.push({
                data: {
                    id: terrId
                },
                position: {
                    x: territoryData.xcoord,
                    y: territoryData.ycoord
                }
            });
            // edge to next node in path
            //  if there is a next node
            if (i+1 < len) {
                elements.push({
                    data: {
                        id: terrId + ',' + path[i+1],
                        source: terrId,
                        target: '' + path[i+1]
                    }
                });
            }
        }
        return elements;
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
                        'line-color': '#f00',
                        'source-arrow-shape': 'none',
                        'mid-source-arrow-shape': 'none',
                        'mid-target-arrow-shape': 'triangle',
                        'mid-target-arrow-fill': 'filled',
                        'mid-target-arrow-color': '#f00',
                        'target-arrow-shape': 'none'
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
}

export let eliminationPathView = new EliminationPathView();

