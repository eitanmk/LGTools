// ==UserScript==
// @name         LG graph test
// @version      0.1
// @description  Get data about game and map in order to help us plan moves
// @include      http://landgrab.net/landgrab/ViewBoard
// @include      http://landgrab.net/landgrab/RealtimeBoard
// @grant        none
// @require      https://ajax.googleapis.com/ajax/libs/jquery/2.1.4/jquery.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.8.3/underscore-min.js
// @require      https://raw.githubusercontent.com/andrewhayward/dijkstra/master/graph.js
// ==/UserScript==
/* jshint -W097 */
'use strict';

jQuery.noConflict();

var territoriesObj = window.territories;
var dummyChokePointData = "[{\"territoryId\": \"129\", \"count\": 4099}, {\"territoryId\": \"73\", \"count\": 3438}, {\"territoryId\": \"77\", \"count\": 3358}, {\"territoryId\": \"142\", \"count\": 2798}, {\"territoryId\": \"94\", \"count\": 2666}, {\"territoryId\": \"168\", \"count\": 2639}, {\"territoryId\": \"22\", \"count\": 2528}, {\"territoryId\": \"49\", \"count\": 2487}, {\"territoryId\": \"114\", \"count\": 2469}, {\"territoryId\": \"133\", \"count\": 2460}, {\"territoryId\": \"153\", \"count\": 2382}, {\"territoryId\": \"147\", \"count\": 2377}, {\"territoryId\": \"74\", \"count\": 2332}, {\"territoryId\": \"183\", \"count\": 2330}, {\"territoryId\": \"186\", \"count\": 2260}, {\"territoryId\": \"65\", \"count\": 2258}, {\"territoryId\": \"106\", \"count\": 2255}, {\"territoryId\": \"107\", \"count\": 2239}, {\"territoryId\": \"115\", \"count\": 2222}, {\"territoryId\": \"34\", \"count\": 2178}, {\"territoryId\": \"185\", \"count\": 2149}, {\"territoryId\": \"86\", \"count\": 2147}, {\"territoryId\": \"85\", \"count\": 2112}, {\"territoryId\": \"95\", \"count\": 2095}, {\"territoryId\": \"152\", \"count\": 2060}, {\"territoryId\": \"83\", \"count\": 2060}, {\"territoryId\": \"180\", \"count\": 2035}, {\"territoryId\": \"21\", \"count\": 2023}, {\"territoryId\": \"31\", \"count\": 1983}, {\"territoryId\": \"17\", \"count\": 1960}, {\"territoryId\": \"59\", \"count\": 1950}, {\"territoryId\": \"37\", \"count\": 1874}, {\"territoryId\": \"82\", \"count\": 1843}, {\"territoryId\": \"151\", \"count\": 1829}, {\"territoryId\": \"64\", \"count\": 1791}]";
dummyChokePointData = JSON.parse(dummyChokePointData);
console.log(dummyChokePointData);

var mapImage = jQuery('#map_image');
var canvas = jQuery('#m_canvas').attr('width', mapImage.attr('width')).attr('height', mapImage.attr('height'));
var ctx = canvas.get(0).getContext('2d');

_.each(dummyChokePointData, (candidate) => {
    var territoryData = territoriesObj[candidate.territoryId];
    console.log(territoryData);
    ctx.beginPath();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#FFFFFF';
    ctx.arc(territoryData.xcoord, territoryData.ycoord, 15, 0, Math.PI * 2);
    ctx.stroke();
});

function determineChokePoints() {

    var bordersPromise = new Promise(function (resolve, reject) {
        window.AjaxProxy.getAllBorders( (borderInfo) => resolve(borderInfo) );
    });

    bordersPromise.then( (borderInfo) => {
        return _.mapObject(borderInfo, (val, key) => {
            var retObj = {};
            _.each(val, (border) => retObj[border] = 1);
            return retObj;
        });
    }).then( (graphData) => {
        return new Graph(graphData);
    }).then( (graph) => {
        var shortestRoutes = {};
        var territoryIdList = _.keys(territories);
        var routesList = [];
        _.each(territoryIdList, (currentId) => {
            _.each(_.without(territoryIdList, currentId), (destId) => {
                if (parseInt(currentId, 10) < parseInt(destId, 10)) {
                    routesList.push("" + currentId + "," + destId);
                } else {
                    routesList.push("" + destId + "," + currentId);
                }
            });
        });
        routesList = _.uniq(routesList);
        console.time('paths');
        console.log('num routes', routesList.length);
        _.each(routesList, (route) => {
            var parts = route.split(',');
            var start = parts[0];
            var end = parts[1];
            var shortestRoute = graph.findShortestPath(start, end);
            console.log(route);
            console.log(shortestRoute);
            shortestRoutes[route] = shortestRoute;
        });
        console.timeEnd('paths');
        return shortestRoutes;
    }).then( (shortestRouteData) => {
        var nodePathCounts = {};
        var routeKeys = _.keys(shortestRouteData);
        _.each(routeKeys, (route) => {
            var pathArr = shortestRouteData[route];
            _.each(pathArr, (node) => {
                if (nodePathCounts[node]) {
                    nodePathCounts[node]++;
                } else {
                    nodePathCounts[node] = 1;
                }
            });
        });
        console.log(nodePathCounts);

        var nodePathCountsArray = [];
        _.each(_.keys(nodePathCounts), (key) => {
            nodePathCountsArray.push({territoryId: key, count: nodePathCounts[key]});
        });
        nodePathCountsArray.sort((a, b) => {
            if (a.count < b.count) { return -1; }
            if (a.count > b.count) { return 1; }
            return 0;
        });
        nodePathCountsArray.reverse();
        nodePathCountsArray = _.filter(nodePathCountsArray, (obj) => obj.count > (0.1 * routeKeys.length) );
        console.log(nodePathCountsArray);
    });
}

