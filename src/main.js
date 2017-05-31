import { UI } from './ui.js';
import { teamData } from './team-data.js';

jQuery.noConflict(); //needed?

UI.setupUI();
teamData.drawSummaryTable();
