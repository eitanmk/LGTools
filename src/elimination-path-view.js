import { GAME } from './game.js';
import { Graph } from './graph.js';
import { EliminationPath } from './elimination-path.js';
import { UI_Utils } from './ui-utils.js';

class EliminationPathView {

    constructor() {
        this.$eliminationPathButton = UI_Utils.makeButton('find elimination path');
        this.$eliminationPathButtonText = this.$eliminationPathButton.find('.button_text');
    }

    getControl() {
        var elimPathObj = this;

        let clickHandler = async function () {
            if (elimPathObj.$graphContainer) {
                elimPathObj.$graphContainer.remove();
            }
            window.disableButton(this);
            let $el = jQuery(this);
            $el.off('click');
            let originalText = elimPathObj.$eliminationPathButtonText.text();
            elimPathObj.$eliminationPathButtonText.text('Select starting territory...');
            try {
                let clickData = await GAME.receiveTerritoryClick();
                await elimPathObj.showHamiltonianPath(clickData.territoryId, clickData.ownerId);
            } catch (ex) {
                GAME.showPopup(ex.message);
            } finally {
                window.enableButton(this);
                $el.on('click', clickHandler);
                elimPathObj.$eliminationPathButtonText.text(originalText);
            }
        };

        this.$eliminationPathButton.on('click', clickHandler);

        return this.$eliminationPathButton;
    }

    async showHamiltonianPath(territoryId, ownerId) {
        let eliminationPathObj = new EliminationPath(null);
        let path = await eliminationPathObj.getEliminationPath(ownerId, territoryId);

        if (path.length > 0) {
            this.$graphContainer = Graph.getNewGraphContainer('elim_path_graph');
            let graphElements = Graph.getPathElements(path);
            this.routeGraph = Graph.getPathGraphObj(this.$graphContainer.get(0), graphElements, '#f00');
            this.$graphContainer.show();
            this.routeGraph.resize();
        } else {
            GAME.showPopup('No elimination path found.');
        }
    }

}

export let eliminationPathView = new EliminationPathView();

