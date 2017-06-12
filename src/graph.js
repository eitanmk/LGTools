import { GAME } from './game.js';
import { UI_Utils } from './ui-utils.js';

class Graph {

    async getGraphElements() {
        if (this.graphElements) {
            return this.graphElements;
        }

        var borderInfo = await GAME.getBorderData();
        var elements = [];
        _.each(_.keys(borderInfo), (terrId) => {
            var territoryData = GAME.territories[terrId];
            // add the nodes
            elements.push({
                data: {
                    id: terrId,
                    name: territoryData.name,
                    owner: territoryData.owner,
                    armies: territoryData.armies
                },
                position: {
                    x: territoryData.xcoord,
                    y: territoryData.ycoord
                }
            });
            // add the edges (directed)
            _.each(borderInfo[terrId], (border) => {
                elements.push({
                    data: {
                        id: terrId + ',' + border,
                        source: terrId,
                        target: '' + border
                    }
                });
            });
        });

        this.graphElements = elements;
        return this.graphElements;
    }

    static getPathElements(pathArr) {
        let elements = [];
        for (let i = 0, len = pathArr.length; i < len; ++i) {
            let terrId = pathArr[i];
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
                        id: terrId + ',' + pathArr[i+1],
                        source: terrId,
                        target: '' + pathArr[i+1]
                    }
                });
            }
        }
        return elements;
    }

    static getNewGraphContainer(id) {
        var [mapWidth, mapHeight] = UI_Utils.mapDimensions();

        var $container = jQuery('<div/>')
            .hide()
            .attr('id', id)
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

    static getHeadlessGraphObj(graphElements) {
        return cytoscape({
            headless: true,
            elements: graphElements
        });
    }

    static getPathGraphObj(containerElement, graphElements, cssColor) {

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
                        'line-color': cssColor,
                        'source-arrow-shape': 'none',
                        'mid-source-arrow-shape': 'none',
                        'mid-target-arrow-shape': 'triangle',
                        'mid-target-arrow-fill': 'filled',
                        'mid-target-arrow-color': cssColor,
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

export { Graph };
