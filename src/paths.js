import { Graph } from './graph.js';

class Paths {

    static async getPath(start, end, weightFn) {
        let graph = new Graph();

        let graphElements = await graph.getGraphElements();
        let graphObj = Graph.getHeadlessGraphObj(graphElements);

        let route = graphObj.elements().aStar({
            root: '#' + start,
            goal: '#' + end,
            weight: weightFn,
            directed: true
        });

        let path = route.path.nodes().map((n) => n.data().id);
        return path;
    }

}

export { Paths };
