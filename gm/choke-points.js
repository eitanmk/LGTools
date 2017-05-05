var determineChokePoints = function () {

    if (GLOBALS.chokePoints) {
        drawChokePoints(GLOBALS.chokePoints);
        return;
    }

    window.disableButton(UI.$chokePointsButton.get(0));
    UI.$chokePointsButton.off('click');

    initializeGraphs.then( () => {
        return new Promise( (resolve, reject) => {
            var chokePoints = [];
            var numTerritories = _.keys(GLOBALS.territories).length;
            var $buttonText = UI.$chokePointsButton.find('.button_text');

            console.time('astar');
            Utils.timedChunk(_.keys(GLOBALS.territories), (terrId, index) => {
            //Utils.timedChunk([144], (terrId, index) => {
                $buttonText.text('Calculating ' + index + ' of ' + numTerritories);
                var routes = [];
                var borders = GLOBALS.borderData['' + terrId];
                var candidateContinent = GLOBALS.territoryToContinentMap[terrId];
                DEBUG('territory', terrId, GLOBALS.territories[terrId].name, 'continent', candidateContinent);
                DEBUG('borders', borders);
                var borderTestCombos = Utils.combinations(borders, 2);
                _.each(borderTestCombos, (combo) => {
                    var root = combo[0];
                    var goal = combo[1];
                    DEBUG('current combo', root, goal);
                    DEBUG('combo continents', root, GLOBALS.territoryToContinentMap[root], goal, GLOBALS.territoryToContinentMap[goal]);
                    // if both the root and goal are in the same continent as candidate, we can skip this combo
                    if (GLOBALS.territoryToContinentMap[root] === candidateContinent &&
                        GLOBALS.territoryToContinentMap[goal] === candidateContinent) {
                        DEBUG('disqualifying b/c both neighbors are in same continent as candidate');
                        return;
                    }

                    // if neither the root nor goal are in the candidate's continent, we can skip this combo
                    if (GLOBALS.territoryToContinentMap[root] !== candidateContinent &&
                        GLOBALS.territoryToContinentMap[goal] !== candidateContinent) {
                        DEBUG('disqualifying b/c both neighbors are in a different continent from candidate');
                        return;
                    }

                    // if we're here, one of the territories in this combo should be in the candidate's continent

                    var route = GLOBALS.borderGraph.elements().aStar({
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
    }).then( (chokePoints) => {
        DEBUG(chokePoints);
        GLOBALS.chokePoints = chokePoints;

        drawChokePoints(chokePoints);

        UI.$chokePointsToggle.find('input').on('click', function () {
            if (this.checked) {
                drawChokePoints(GLOBALS.chokePoints);
            } else {
                resetCanvas();
            }
        });
        UI.$chokePointsButton.replaceWith(UI.$chokePointsToggle);
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
        var territoryData = GLOBALS.territories[candidate];
        ctx.beginPath();
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#FFFFFF';
        ctx.arc(territoryData.xcoord, territoryData.ycoord, 20, 0, Math.PI * 2);
        ctx.stroke();
    });
};

