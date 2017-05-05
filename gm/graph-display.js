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

    var $mapImage = UI.$mapImage;
    var mapWidth = $mapImage.attr('width');
    var mapHeight = $mapImage.attr('height');
    UI.$graphCanvas.html('&nbsp').css({
        position: 'absolute',
        top: 0,
        left: 0,
        width: mapWidth + 'px',
        height: mapHeight + 'px',
        zIndex: 100
    });

    GLOBALS.borderGraph = cytoscape({
        //headless: true,
        container: UI.$graphCanvas.get(0),
        elements: elements,
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
});

var setupUI = function () {
    // fix huge annoyance of having attack reports always enabled by default...
    jQuery('#attack_reports_cb').trigger('click');

    UI.$chokePointsButton.on('click', determineChokePoints);
    UI.addToToolsContainer(UI.$chokePointsButton);

    UI.$graphToggle.find('input').on('click', function () {
        if (this.checked) {
            UI.$graphCanvas.show();
            if (!GLOBALS.graphDrawn) {
                GLOBALS.borderGraph.resize();
                GLOBALS.graphDrawn = true;
            }
        } else {
            UI.$graphCanvas.hide();
        }
    });
    UI.addToToolsContainer(UI.$graphToggle);

    UI.$anchorPoint.append(UI.$smToolsHeading);
    UI.$anchorPoint.append(UI.$toolsContainer);
};
