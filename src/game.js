class Game {

    constructor() {
        this.oldHandleTerritoryClick = window.handleTerritoryClick;
    }

    get players() {
        return window.players;
    }

    get territories() {
        return window.territories;
    }

    get territoryToContinentMap() {
        return window.ttcVals;
    }

    get bridgesAndWallsEnabled() {
        return window.bridgesAndWallsEnabled;
    }

    get isTeamGame() {
        return window.teamGame === true;
    }

    showPopup(msg, type) {
        window.showPopupMessage(msg, type);
    }

    // perhaps make borderData private someday, using Symbol or #
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

    receiveTerritoryClick(handlerFn) {
        return new Promise( (resolve) => {
            window.handleTerritoryClick = (...args) => {
                handlerFn(...args).then( () => {
                    window.handleTerritoryClick = this.oldHandleTerritoryClick;
                    resolve();
                });
            };
        });
    }

}

export let GAME = new Game();
