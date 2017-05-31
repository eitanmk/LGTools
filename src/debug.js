var DEBUG_ENABLED = !!0;

export function DEBUG() {
    if (DEBUG_ENABLED) console.log.apply(console, arguments);
}
