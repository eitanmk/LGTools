class Game {

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

}

export let GAME = new Game();
