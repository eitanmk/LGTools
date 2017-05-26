import { Utils } from './utils.js';
import { GraphView } from './graph-display.js';
import { ChokePointsView } from './choke-points-display.js';

export var UI = {
    $mapImage: jQuery('#map_image'),
    $canvas: jQuery('#m_canvas'),
    $graphCanvas: jQuery('<div/>').hide().attr('id', 'sm_graph').insertAfter(jQuery('#m_canvas')),
    $playerTable: jQuery('.data_tables_table .data_table').first(),
    $teamTable: jQuery('.data_tables_table .data_table').last(),

    $anchorPoint: jQuery('<div id="sm_tools"></div>').insertAfter('#control_panel_upper'),

    $smToolsHeading: jQuery('<div/>').css({
        margin: '5px 3px 0 0',
        padding: '4px',
        borderTop: '1px solid #ebe585',
        borderBottom: '1px solid #ebe585',
        background: 'url(images/blue_20_opac.png) 0 0 repeat'
    }).append('<span style="color: white; font-weight: bold;">SM Tools</span>'),

    $toolsContainer: jQuery('<div/>').addClass('control_panel_table').html([
        '<table style="padding-right: 5px; padding-left:5px"><tr><td>',
        '</td></tr></table>'
    ].join('')),

    $chokePointsButton: Utils.makeUIButton('show choke points'),
    $chokePointsToggle: Utils.makeUICheckbox('choke_points_toggle', 'Toggle choke points', true),

    $graphToggle: Utils.makeUICheckbox('graph_toggle', 'Toggle graph layer', false),

    addToToolsContainer: function ($elem) {
        UI.$toolsContainer.find('table tr td').first().append($elem);
    },

    $teamSummaryTable: jQuery([
        '<td valign="top" style="padding-left: 5px; width: 40%">',
        '<table border="0" cellpadding="0" cellspacing="0" class="data_table">',
        '<thead>',
        '<tr><td colspan="4">Team Summary</td></tr>',
        '<tr><td>Team</td><td>Territories</td><td>Troops</td><td>Cards</td></tr>',
        '</thead>',
        '<tbody></tbody>',
        '</table>',
        '</td>'
    ].join('')).find('thead td').css('background-image', 'url(images/white_40_opac.png)').end()
};

export function setupUI() {
    // fix huge annoyance of having attack reports always enabled by default...
    jQuery('#attack_reports_cb').trigger('click');
    
    UI.$chokePointsButton.on('click', function () {
        window.disableButton(this);
        jQuery(this).off('click');
        var chokePointsViewObj = new ChokePointsView();
        chokePointsViewObj.drawChokePoints().then( () => {
            UI.$chokePointsToggle.find('input').on('click', function () {
                if (this.checked) {
                    chokePointsViewObj.drawChokePoints();
                } else {
                    chokePointsViewObj._resetCanvas();
                }
            });
            UI.$chokePointsButton.replaceWith(UI.$chokePointsToggle);
        });
    });
    UI.addToToolsContainer(UI.$chokePointsButton);

    var graphViewObj = new GraphView();
    graphViewObj.init().then( () => {
        UI.$graphToggle.find('input').on('click', function () {
            if (this.checked) {
                graphViewObj.show();
            } else {
                graphViewObj.hide();
            }
        });
    });
    UI.addToToolsContainer(UI.$graphToggle);

    UI.$anchorPoint.append(UI.$smToolsHeading);
    UI.$anchorPoint.append(UI.$toolsContainer);
}
