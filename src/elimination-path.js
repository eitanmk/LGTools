import { DEBUG } from './debug.js';
import { GAME } from './game.js';

class EliminationPath {

    constructor(view) {
        this.viewObj = view;
    }

    async getEliminationPath(playerId, startTerritoryId) {
        var borderData = await GAME.getBorderData();

        var cluster = await this._getCluster(playerId, startTerritoryId, borderData);
        DEBUG(cluster);

        var clusterBorderData = {};
        cluster.forEach( (terrId) => {
            clusterBorderData[terrId] = borderData[terrId];
        });
        DEBUG(clusterBorderData);

        var eliminationPath = await this._findHamiltonianPath(startTerritoryId, clusterBorderData, cluster.length);
        return eliminationPath;
    }

    _getCluster(playerId, startTerritoryId, borderData) {

        let recurse = function (territoryId, playerId, borderData, visitedHash, cluster) {
            cluster.push(territoryId);
            visitedHash[territoryId] = true;

            let neighbors = borderData[territoryId];
            for (let i = 0, len = neighbors.length; i < len; ++i) {
                let curNeighbor = neighbors[i];
                if (visitedHash[curNeighbor] === false && GAME.territories[curNeighbor].owner == playerId) {
                    recurse(curNeighbor, playerId, borderData, visitedHash, cluster);
                }

            }
        };

        return new Promise( (resolve) => {
            let cluster = [];
            let numTerritories = _.keys(GAME.territories).length;
            let visitedHash = new Array(numTerritories);

            // set all indices to false
            visitedHash.fill(false);

            visitedHash[startTerritoryId] = true;
            cluster.push(startTerritoryId);

            let startNeighbors = borderData[startTerritoryId];
            for (let i = 0, len = startNeighbors.length; i < len; ++i) {
                let curNeighbor = startNeighbors[i];
                if (visitedHash[curNeighbor] === false && GAME.territories[curNeighbor].owner == playerId) {
                    recurse(curNeighbor, playerId, borderData, visitedHash, cluster);
                }

            }

            resolve(cluster);
        });
    }

    _findHamiltonianPath(startTerritoryId, borderData, pathLength) {

        let recurse = function (territoryId, borderData, inStackHash, pathStack, pathLength) {
            DEBUG('dfs', territoryId, pathStack.length);

            // base case: if stack count is the same as the number of nodes, we're done
            if (pathStack.length == pathLength) {
                return true;
            }

            let neighbors = borderData[territoryId];

            for (let i = 0, len = neighbors.length; i < len; ++i) {
                let curNeighbor = neighbors[i];
                DEBUG(curNeighbor, inStackHash[curNeighbor]);
                if (!borderData[curNeighbor]) continue;

                if (inStackHash[curNeighbor] === false) {
                    inStackHash[curNeighbor] = true;
                    pathStack.push(curNeighbor);

                    if (recurse(curNeighbor, borderData, inStackHash, pathStack, pathLength)) {
                        DEBUG('returning true');
                        return true;
                    }
                    DEBUG(territoryId, 'post dfs');
                    inStackHash[curNeighbor] = false;
                    pathStack.pop();
                }
            }
            DEBUG('returning false');
            return false;
        };

        return new Promise( (resolve) => {
            let pathStack = [];
            let numTerritories = _.keys(GAME.territories).length;
            let inStackHash = new Array(numTerritories);

            // set all indices to false
            inStackHash.fill(false);

            inStackHash[startTerritoryId] = true;
            pathStack.push(startTerritoryId);

            let startNeighbors = borderData[startTerritoryId];
            for (let i = 0, len = startNeighbors.length; i < len; ++i) {
                let curNeighbor = startNeighbors[i];
                if (!borderData[curNeighbor]) continue;

                inStackHash[curNeighbor] = true;
                pathStack.push(curNeighbor);

                if (recurse(curNeighbor, borderData, inStackHash, pathStack, pathLength)) {
                    resolve(pathStack);
                    return;
                }
                inStackHash[curNeighbor] = false;
                pathStack.pop();
            }

            resolve(false);
        });
    }
}

export { EliminationPath };
