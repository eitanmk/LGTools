import { Router } from './router.js';
import { gameSwitcher } from './game-switcher.js';
import { UI } from './ui.js';
import { teamData } from './team-data.js';

Router.route(/Home$/, () => {
    gameSwitcher.updateActiveGames();
});

Router.route(/ViewBoard$/, () => {
    UI.setupUI();
    teamData.drawSummaryTable();
});

// all pages
gameSwitcher.addToPage();
