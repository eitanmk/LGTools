class Game {

    constructor() {
        this.oldHandleTerritoryClick = window.handleTerritoryClick;
        this.customTerritoryClickHandlerSet = false;
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

    get gameNumber() {
        return window.beanGameNumber;
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
        if (!this.customTerritoryClickHandlerSet) {
            this.customTerritoryClickHandlerSet = true;
            return new Promise( (resolve) => {
                window.handleTerritoryClick = (...args) => {
                    handlerFn(...args).then( () => {
                        window.handleTerritoryClick = this.oldHandleTerritoryClick;
                        this.customTerritoryClickHandlerSet = false;
                        resolve();
                    });
                };
            });
        } else {
            return Promise.reject(new Error('Territory click handler is waiting for another action.'));
        }
    }

}

export let GAME = new Game();
