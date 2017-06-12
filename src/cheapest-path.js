import { GAME } from './game.js';
import { Graph } from './graph.js';

class CheapestPath {

    async getCheapestPath(start, end) {
        let graphObj = new Graph();

        let graphElements = await graphObj.getGraphElements();
        this.graph = Graph.getHeadlessGraphObj(graphElements);
        let path = this._calculateCheapestPath(start, end);
        return path;
    }

    _calculateCheapestPath(start, end) {
        let route = this.graph.elements().aStar({
            root: '#' + start,
            goal: '#' + end,
            weight: (edge) => {
                if (edge.target().data().owner == GAME.playerId) {
                    return Infinity;
                }
                return edge.target().data().armies;
            },
            directed: true
        });
        return route.path.nodes().map((n) => n.data().id);
    }

}

export { CheapestPath };
