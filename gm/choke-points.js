import { DEBUG } from './debug.js';
import { GAME } from './game.js';
import { UI } from './ui.js';
import { Utils } from './utils.js';
import { Graph } from './graph.js';

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

export { ChokePoints };
