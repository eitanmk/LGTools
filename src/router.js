class Router {

    static route(pattern, callback) {
        if ( !_.isRegExp(pattern) ) {
            return;
        }
        if (pattern.test(document.URL)) {
            callback();
        }
    }

}

export { Router };
