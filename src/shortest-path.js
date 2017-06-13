import { GAME } from './game.js';
import { Graph } from './graph.js';

class ShortestPath {

    async getShortestPath(start, end) {
        let graphObj = new Graph();

        let graphElements = await graphObj.getGraphElements();
        this.graph = Graph.getHeadlessGraphObj(graphElements);
        let path = this._calculateShortestPath(start, end);
        return path;
    }

    _calculateShortestPath(start, end) {
        let route = this.graph.elements().aStar({
            root: '#' + start,
            goal: '#' + end,
            weight: (edge) => {
                // TODO: avoid teammates in team games?
                if (edge.target().data().owner == GAME.playerId) {
                    return Infinity;
                }
                return 1;
            },
            directed: true
        });
        return route.path.nodes().map((n) => n.data().id);
    }

}

export { ShortestPath };
