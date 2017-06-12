import { DEBUG } from './debug.js';
import { GAME } from './game.js';
import { Graph } from './graph.js';

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
        this.graph = Graph.getHeadlessGraphObj(graphElements);
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

export { ChokePoints };
