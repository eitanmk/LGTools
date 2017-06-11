import { GAME } from './game.js';

class GameSwitcher {

    constructor() {
        this.storageKey = 'lgtools.activeGames';
    }

    updateActiveGames() {
        // should only run on /Home
        let activeGameData = [];
        jQuery('[id^=game_div_].gb_hl, [id^=game_div_].gb_n').each( function () {
            let gameId = this.id.match(/game_div_(\d+)/)[1];
            let gameName = jQuery(this).find('.gamename a').text();

            activeGameData.push({ id: gameId, name: gameName });
        });
        window.localStorage.setItem(this.storageKey, JSON.stringify(activeGameData));
    }

    addToPage() {
        // remove the purchase nag if it's there. i want the space
        jQuery('#ConsiderPurchase').remove();

        let $container = jQuery('<div><select></select></div>').css({
            position: 'absolute',
            top: '35px',
            left: '500px',
            zIndex: 11
        }).appendTo('body');

        let activeGameDataStr = window.localStorage.getItem(this.storageKey);
        if (!activeGameDataStr) {
            return;
        }
        // no idea why JSON.parse is needed twice
        let activeGameData = JSON.parse(JSON.parse(activeGameDataStr));

        // only show if there is more than one game to switch between
        if (activeGameData.length <= 1) {
            return;
        }

        let $selectTarget = $container.find('select');
        if (!GAME.gameNumber) {
            $selectTarget.append('<option value="0">Select game:</option>');
        }
        _.each(activeGameData, function (data) {
            let selectedAttr = GAME.gameNumber && GAME.gameNumber == data.id ? ' selected' : '';
            $selectTarget.append(`<option value="${data.id}"${selectedAttr}>${data.name}</option>`);
        });

        $selectTarget.on('change', function (ev) {
            let val = ev.target.value;
            if (val == 0) {
                return;
            }
            window.location = '/landgrab/Home?g=' + val;
        });
    }
}

export let gameSwitcher = new GameSwitcher();
