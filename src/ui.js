import { graphView } from './graph-view.js';
import { chokePointsView } from './choke-points-view.js';
import { cheapestPathView } from './cheapest-path-view.js';
import { eliminationPathView } from './elimination-path-view.js';

class UI {

    static setupUI() {
        // fix huge annoyance of having attack reports always enabled by default...
        jQuery('#attack_reports_cb').trigger('click');

        let $anchorPoint = jQuery('<div id="sm_tools"></div>').insertAfter('#control_panel_upper');
        let $smToolsHeading = jQuery('<div/>').css({
            margin: '5px 3px 0 0',
            padding: '4px',
            borderTop: '1px solid #ebe585',
            borderBottom: '1px solid #ebe585',
            background: 'url(images/blue_20_opac.png) 0 0 repeat'
        }).append('<span style="color: white; font-weight: bold;">SM Tools</span>');
        let $toolsContainer = jQuery('<div/>').addClass('control_panel_table').html(
            '<table style="padding-right: 5px; padding-left:5px"><tr><td></td></tr></table>'
        );

        $anchorPoint.append($smToolsHeading);
        $anchorPoint.append($toolsContainer);

        let $controlInsertionPoint = $toolsContainer.find('table tr td').first();
        $controlInsertionPoint.append(cheapestPathView.getControl());
        $controlInsertionPoint.append(eliminationPathView.getControl());
        $controlInsertionPoint.append(chokePointsView.getControl());
        $controlInsertionPoint.append(graphView.getControl());
    }
}

export { UI };
