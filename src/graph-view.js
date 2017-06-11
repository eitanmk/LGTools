import { Graph } from './graph.js';
import { UI_Utils } from './ui-utils.js';

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
                zIndex: 1
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

export let graphView = new GraphView();

