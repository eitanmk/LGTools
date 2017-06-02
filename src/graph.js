import { GAME } from './game.js';

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
}

export { Graph };
