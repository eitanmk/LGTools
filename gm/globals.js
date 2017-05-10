export var GLOBALS = {
    players: window.players,
    territories: window.territories,
    territoryToContinentMap: window.ttcVals,
    // TODO, use to determine graph can change during play. could cause choke points to be wrong if loaded from db
    bridgesAndWallsEnabled: window.bridgesAndWallsEnabled,
    isTeamGame: window.teamGame === true,
    borderData: null,
    borderGraph: null,
    // TODO maybe these shouldn't be global?
    graphDrawn: false,
    chokePoints: null
};
