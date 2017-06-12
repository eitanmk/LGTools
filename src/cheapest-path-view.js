import { GAME } from './game.js';
import { Graph } from './graph.js';
import { CheapestPath } from './cheapest-path.js';
import { UI_Utils } from './ui-utils.js';

class CheapestPathView {

    constructor() {
        this.$cheapestPathButton = UI_Utils.makeButton('find cheapest path');
        this.$cheapestPathButtonText = this.$cheapestPathButton.find('.button_text');
    }

    getControl() {
        var cheapPathObj = this;

        let clickHandler = async function () {
            if (cheapPathObj.$graphContainer) {
                cheapPathObj.$graphContainer.remove();
            }
            window.disableButton(this);
            let $el = jQuery(this);
            $el.off('click');
            let originalText = cheapPathObj.$cheapestPathButtonText.text();
            try {
                cheapPathObj.$cheapestPathButtonText.text('Select starting territory...');
                let { territoryId: startTerr } = await GAME.receiveTerritoryClick();
                cheapPathObj.$cheapestPathButtonText.text('Select ending territory...');
                let { territoryId: endTerr } = await GAME.receiveTerritoryClick();
                await cheapPathObj.showCheapestPath.call(cheapPathObj, startTerr, endTerr);
            } catch (ex) {
                GAME.showPopup(ex.message);
            } finally {
                window.enableButton(this);
                $el.on('click', clickHandler);
                cheapPathObj.$cheapestPathButtonText.text(originalText);
            }
        };

        this.$cheapestPathButton.on('click', clickHandler);

        return this.$cheapestPathButton;
    }

    async showCheapestPath(start, end) {
        let cheapestPathObj = new CheapestPath();
        let path = await cheapestPathObj.getCheapestPath(start, end);

        this.$graphContainer = Graph.getNewGraphContainer('cheap_path_graph');
        let graphElements = Graph.getPathElements(path);
        this.routeGraph = Graph.getPathGraphObj(this.$graphContainer.get(0), graphElements, '#00f');
        this.$graphContainer.show();
        this.routeGraph.resize();
    }

}

export let cheapestPathView = new CheapestPathView();

