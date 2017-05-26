import { GAME } from './game.js';

class Graph {

    getBorderData() {
        return new Promise( (resolve) => {
            if (this.borderData) {
                resolve(this.borderData);
            } else {
                window.AjaxProxy.getAllBorders( (borderInfo) => {
                    this.borderData = borderInfo;
                    resolve(borderInfo);
                });
            }
        });
    }

    _createGraphElements(borderInfo) {
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

    async getGraphElements() {
        if (this.graphElements) {
            return this.graphElements;
        }

        var borderInfo = await this.getBorderData();
        return this._createGraphElements(borderInfo);
    }
}

export { Graph };
