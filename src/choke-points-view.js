import { GAME } from './game.js';
import { UI_Utils } from './ui-utils.js';
import { ChokePoints } from './choke-points.js';

class ChokePointsView {

    constructor() {
        this.$canvas = jQuery('<canvas>').css({
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: '2'
        }).insertAfter('#m_canvas');
        this.$chokePointsButton = UI_Utils.makeButton('show choke points');
        this.$chokePointsButtonText = this.$chokePointsButton.find('.button_text');
        this.$chokePointsToggle = UI_Utils.makeCheckbox('choke_points_toggle', 'Toggle choke points', true);
    }

    getControl() {
        var chokePointsViewObj = this;

        this.$chokePointsButton.on('click', function () {
            window.disableButton(this);
            jQuery(this).off('click');

            chokePointsViewObj.drawChokePoints().then( () => {
                chokePointsViewObj.$chokePointsToggle.find('input').on('click', function () {
                    if (this.checked) {
                        chokePointsViewObj.drawChokePoints();
                    } else {
                        chokePointsViewObj.resetCanvas();
                    }
                });
                chokePointsViewObj.$chokePointsButton.replaceWith(chokePointsViewObj.$chokePointsToggle);
            });
        });

        return this.$chokePointsButton;
    }

    updateButtonText(txt) {
        this.$chokePointsButtonText.text(txt);
    }

    drawChokePoints() {
        if (!this.chokePointsObj) {
            this.chokePointsObj = new ChokePoints(this);
        }

        return this.chokePointsObj.getChokePoints().then( (chokePoints) => {
            this.resetCanvas();
            var ctx = this.$canvas.get(0).getContext('2d');

            _.each(chokePoints, (candidate) => {
                var territoryData = GAME.territories[candidate];
                ctx.beginPath();
                ctx.lineWidth = 3;
                ctx.strokeStyle = '#FFFFFF';
                ctx.arc(territoryData.xcoord, territoryData.ycoord, 20, 0, Math.PI * 2);
                ctx.stroke();
            });
        });
    }

    resetCanvas() {
        let [mapWidth, mapHeight] = UI_Utils.mapDimensions();
        var $canvas = this.$canvas.attr('width', mapWidth).attr('height', mapHeight);
        var ctx = $canvas.get(0).getContext('2d');
        ctx.clearRect(0, 0, mapWidth, mapHeight);
    }

}

export let chokePointsView = new ChokePointsView();
