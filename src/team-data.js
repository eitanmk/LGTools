import { GAME } from './game.js';
import { UI_Utils } from './ui-utils.js';

class TeamData {

    drawSummaryTable() {
        if (!GAME.isTeamGame) {
            return;
        }

        let $teamSummaryTable = UI_Utils.makeDataTable('Team Summary', 4, 'Team', 'Territories', 'Troops', 'Cards');

        let $dataTables = jQuery('.data_tables_table .data_table');
        let $playerTable = $dataTables.first();
        let $teamTable = $dataTables.last();

        $playerTable.closest('.data_tables_table').attr('width', 1000);
        $playerTable.closest('td').attr('colspan', '').after($teamSummaryTable);

        var teamData = {};

        $teamTable.find('tbody tr').each(function (index, row) {
            var teamId = '' + (index + 1);
            var $cell = jQuery(row).find('td').first();
            teamData[teamId] = { bgcolor: $cell.attr('bgcolor'), color: $cell.css('color'), name: jQuery.trim($cell.text()) };
        });

        $playerTable.find('tbody tr').each(function (index, row) {
            var territoryCount = 0, troopCount = 0, cardCount = 0;
            var $row = jQuery(row);
            var $columns = $row.find('td');
            var playerName = jQuery.trim($columns.eq(1).text());
            var playerObj = _.find(_.values(GAME.players), function (obj) { return obj.name.indexOf(playerName) === 0; });
            var teamId = '' + playerObj.teamNumber;
            var $testColumn = $columns.eq(2);
            if (! $testColumn.attr('colspan')) {
                territoryCount = parseInt(jQuery.trim($columns.eq(2).text()), 10);
                troopCount = parseInt(jQuery.trim($columns.eq(3).text()), 10);
                cardCount = parseInt(jQuery.trim($columns.eq(5).text()), 10);
            }

            var teamObj = teamData[teamId];
            if (teamObj.territories) {
                teamObj.territories += territoryCount;
            } else {
                teamObj.territories = territoryCount;
            }

            if (teamObj.troops) {
                teamObj.troops += troopCount;
            } else {
                teamObj.troops = troopCount;
            }

            if (teamObj.cards) {
                teamObj.cards += cardCount;
            } else {
                teamObj.cards = cardCount;
            }
        });

        var totalTerritories = _.keys(GAME.territories).length;
        var totalTroops = _.reduce(_.values(teamData), function (memo, data) { return memo + data.troops; }, 0);

        var tdBorder = 'border-top: 1px solid #787878';
        var $rowTarget = $teamSummaryTable.find('tbody');
        _.each(_.values(teamData), function (data, index) {
            $rowTarget.append(`
                <tr${index % 2 === 1 ? ' style="background-image: url(images/white_20_opac.png)"' : ''}>
                    <td style="${tdBorder}; background: ${data.bgcolor}; color: ${data.color}">${data.name}</td> 
                    <td style="${tdBorder};">${data.territories} (${Math.round( (data.territories / totalTerritories) * 10000 ) / 100}%)</td>
                    <td style="${tdBorder};">${data.troops} (${Math.round( (data.troops / totalTroops) * 10000 ) / 100}%)</td>
                    <td style="${tdBorder};">${data.cards}</td>
                </tr>
            `);
        });
    }
}

export let teamData = new TeamData();

