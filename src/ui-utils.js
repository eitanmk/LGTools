class UI_Utils {

    static mapDimensions() {
        var $mapImage = jQuery('#map_image');
        return [$mapImage.attr('width'), $mapImage.attr('height')];
    }

    static makeButton(text) {
        return jQuery(`
            <table class="button_table">
                <tr>
                    <td class="button_table_left"></td>
                    <td class="button_text">${text.toUpperCase()}</td>
                    <td class="button_table_right"></td>
                </tr>
            </table>
        `);
    }

    static makeCheckbox(id, text, checked) {
        return jQuery(`
            <div>
                <input type="checkbox" id="${id}" ${checked ? 'checked="checked"' : ''} />
                <label for="${id}">${text}</label>
            </div>
        `);
    }

    static makeDataTable(tableHeading, numCols, ...columnHeadings) {
        var table = `
            <td valign="top" style="padding-left: 5px; width: 40%">
                <table border="0" cellpadding="0" cellspacing="0" class="data_table">
                    <thead>
                        <tr><td colspan="${numCols}">${tableHeading}</td></tr>
                        <tr><td>${columnHeadings.join('</td><td>')}</td></tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </td>
        `;
        return jQuery(table).find('thead td').css('background-image', 'url(images/white_40_opac.png)').end();
    }
}

export { UI_Utils };
