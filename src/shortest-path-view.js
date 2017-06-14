import { GAME } from './game.js';
import { Graph } from './graph.js';
import { Paths } from './paths.js';
import { UI_Utils } from './ui-utils.js';

class ShortestPathView {

    constructor() {
        this.$shortestPathButton = UI_Utils.makeButton('find shortest path');
        this.$shortestPathButtonText = this.$shortestPathButton.find('.button_text');
    }

    getControl() {
        var shortPathObj = this;

        let clickHandler = async function () {
            if (shortPathObj.$graphContainer) {
                shortPathObj.$graphContainer.remove();
            }
            window.disableButton(this);
            let $el = jQuery(this);
            $el.off('click');
            let originalText = shortPathObj.$shortestPathButtonText.text();
            try {
                shortPathObj.$shortestPathButtonText.text('Select starting territory...');
                let { territoryId: startTerr } = await GAME.receiveTerritoryClick();
                shortPathObj.$shortestPathButtonText.text('Select ending territory...');
                let { territoryId: endTerr } = await GAME.receiveTerritoryClick();
                await shortPathObj.showShortestPath.call(shortPathObj, startTerr, endTerr);
            } catch (ex) {
                GAME.showPopup(ex.message);
            } finally {
                window.enableButton(this);
                $el.on('click', clickHandler);
                shortPathObj.$shortestPathButtonText.text(originalText);
            }
        };

        this.$shortestPathButton.on('click', clickHandler);

        return this.$shortestPathButton;
    }

    async showShortestPath(start, end) {
        let path = await Paths.getPath(start, end, (edge) => {
            // TODO: avoid teammates in team games?
            if (edge.target().data().owner == GAME.playerId) {
                return Infinity;
            }
            return 1;
        });

        this.$graphContainer = Graph.getNewGraphContainer('short_path_graph');
        let graphElements = Graph.getPathElements(path);
        this.routeGraph = Graph.getPathGraphObj(this.$graphContainer.get(0), graphElements, '#0f0');
        this.$graphContainer.show();
        this.routeGraph.resize();
    }

}

export let shortestPathView = new ShortestPathView();

