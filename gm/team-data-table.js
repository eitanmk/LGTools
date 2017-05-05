var createTeamDataTable = function () {
    if (!GLOBALS.isTeamGame) {
        return;
    }

    UI.$playerTable.closest('.data_tables_table').attr('width', 1000);
    UI.$playerTable.closest('td').attr('colspan', '').after(UI.$teamSummaryTable);

    var teamData = {};

    UI.$teamTable.find('tbody tr').each(function (index, row) {
        var teamId = '' + (index + 1);
        var $cell = jQuery(row).find('td').first();
        teamData[teamId] = { bgcolor: $cell.attr('bgcolor'), color: $cell.css('color'), name: jQuery.trim($cell.text()) };
    });

    UI.$playerTable.find('tbody tr').each(function (index, row) {
        var territoryCount = 0, troopCount = 0, cardCount = 0;
        var playerName = jQuery.trim(jQuery(row).find('td').eq(1).text());
        var playerObj = _.find(_.values(GLOBALS.players), function (obj) { return obj.name.indexOf(playerName) === 0; });
        var teamId = '' + playerObj.teamNumber;
        var $testColumn = jQuery(row).find('td').eq(2);
        if (! $testColumn.attr('colspan')) {
            territoryCount = parseInt(jQuery.trim(jQuery(row).find('td').eq(2).text()), 10);
            troopCount = parseInt(jQuery.trim(jQuery(row).find('td').eq(3).text()), 10);
            cardCount = parseInt(jQuery.trim(jQuery(row).find('td').eq(5).text()), 10);
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

    var totalTerritories = _.keys(GLOBALS.territories).length;
    var totalTroops = _.reduce(_.values(teamData), function (memo, data) { return memo + data.troops; }, 0);

    var $rowTarget = UI.$teamSummaryTable.find('tbody');
    _.each(_.values(teamData), function (data, index) {
        var rowBackground = index % 2 === 1 ? ' style="background-image: url(images/white_20_opac.png)"' : '';
        $rowTarget.append([
            '<tr', rowBackground, '>',
            '<td style="border-top: 1px solid #787878; background: ', data.bgcolor, '; color: ', data.color, '">', data.name, '</td>',
            '<td style="border-top: 1px solid #787878;">', data.territories, ' (', Math.round( (data.territories / totalTerritories) * 10000) / 100, '%)</td>',
            '<td style="border-top: 1px solid #787878;">', data.troops, ' (', Math.round( (data.troops / totalTroops) * 10000) / 100, '%)</td>',
            '<td style="border-top: 1px solid #787878;">', data.cards, '</td>',
            '</tr>'
        ].join(''));
    });
};

