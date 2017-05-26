import { GAME } from './game.js';
import { UI } from './ui.js';
import { ChokePoints } from './choke-points.js';

class ChokePointsView {

    _resetCanvas() {
        var $mapImage = UI.$mapImage;
        var mapWidth = $mapImage.attr('width');
        var mapHeight = $mapImage.attr('height');
        var $canvas = UI.$canvas.attr('width', mapWidth).attr('height', mapHeight);
        var ctx = $canvas.get(0).getContext('2d');
        ctx.clearRect(0, 0, mapWidth, mapHeight);
    }

    drawChokePoints() {
        if (!this.chokePointsObj) {
            this.chokePointsObj = new ChokePoints();
        }

        return this.chokePointsObj.getChokePoints().then( (chokePoints) => {
            this._resetCanvas();
            var ctx = UI.$canvas.get(0).getContext('2d');

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
}

export { ChokePointsView };
