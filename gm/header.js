// ==UserScript==
// @name         LG graph test
// @version      0.1
// @description  Get data about game and map in order to help us plan moves
// @include      http://landgrab.net/landgrab/ViewBoard
// @include      http://landgrab.net/landgrab/RealtimeBoard
// @grant        none
// @require      https://ajax.googleapis.com/ajax/libs/jquery/2.1.4/jquery.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.8.3/underscore-min.js
// @require      https://raw.githubusercontent.com/eitanmk/LGTools/master/gm/deps/cytoscape-2.5.4.js
// ==/UserScript==
/* jshint -W097 */
/* jshint esnext: true */
/* globals console, jQuery, _, cytoscape */
'use strict';

jQuery.noConflict();
