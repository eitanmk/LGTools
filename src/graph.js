import { GAME } from './game.js';

class Graph {

    async getGraphElements() {
        if (this.graphElements) {
            return this.graphElements;
        }

        var borderInfo = await GAME.getBorderData();
        var elements = [];
        _.each(_.keys(borderInfo), (key) => {
            var territoryData = GAME.territories[key];
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

        this.graphElements = elements;
        return this.graphElements;
    }
}

export { Graph };
