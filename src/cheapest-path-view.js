import { GAME } from './game.js';
import { Graph } from './graph.js';
import { Paths } from './paths.js';
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
                let { territoryId: startTerr, ownerId } = await GAME.receiveTerritoryClick();
                cheapPathObj.playerOnStartTerr = ownerId;
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
        let path = await Paths.getPath(start, end, (edge) => {
            // TODO: avoid teammates in team games?
            if (edge.target().data().owner == this.playerOnStartTerr) {
                return Infinity;
            }
            return edge.target().data().armies;
        });

        this.$graphContainer = Graph.getNewGraphContainer('cheap_path_graph');
        let graphElements = Graph.getPathElements(path);
        this.routeGraph = Graph.getPathGraphObj(this.$graphContainer.get(0), graphElements, '#00f');
        this.$graphContainer.show();
        this.routeGraph.resize();
    }

}

export let cheapestPathView = new CheapestPathView();

