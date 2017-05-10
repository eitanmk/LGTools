export var Utils = {
    timedChunk: function (items, process, context, callback) {
        var todo = items.concat();   //create a clone of the original
        var count = 0;
        setTimeout(function chunk() {
            var start = +new Date();
            do {
                process.call(context, todo.shift(), count);
                count++;
            } while (todo.length > 0 && (+new Date() - start < 50));

            if (todo.length > 0){
                setTimeout(chunk, 25);
            } else {
                callback(items);
            }
        }, 25);
    },

    combinations: function combinations(arr, k) {
        var i, subI, ret = [], sub,	next;
        for (i = 0; i < arr.length; i++) {
            if (k === 1) {
                ret.push([ arr[i] ]);
            } else {
                sub = combinations(arr.slice(i + 1, arr.length), k - 1);
                for (subI = 0; subI < sub.length; subI++ ) {
                    next = sub[subI];
                    next.unshift(arr[i]);
                    ret.push(next);
                }
            }
        }
        return ret;
    },

    makeUIButton: function (text) {
        return jQuery([
            '<table class="button_table"><tr>',
            '<td class="button_table_left"></td>',
            '<td class="button_text">', text.toUpperCase(), '</td>',
            '<td class="button_table_right"></td>',
            '</tr></table>'
        ].join(''));
    },

    makeUICheckbox: function (id, text, checked) {
        var checkedVal = '';
        if (checked) {
            checkedVal = ' checked="checked"';
        }

        return jQuery([
            '<div>',
            '<input type="checkbox"', checkedVal, '" id="', id, '" />',
            '<label for="', id, '">', text, '</label>',
            '</div>'
        ].join(''));
    }
};
