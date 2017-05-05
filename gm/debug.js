var DEBUG_ENABLED = !!0;

var DEBUG = function () {
    if (DEBUG_ENABLED) console.log.apply(console, arguments);
};

