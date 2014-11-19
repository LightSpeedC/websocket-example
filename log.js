// log.js

/*
  log.trace('log.trace');
  log.debug('log.debug');
  log.info('log.info');
  log.warn('log.warn');
  log.error('log.error');
  log.fatal('log.fatal');

  log.container($('#container'));
*/

(function (w, d) {
  'use strict';

  var cur = new Date();
  function delta() {
    var prev = cur; cur = new Date();
    return ('       ' + (cur - prev)).slice(-8) + ' msec. '; }

  var $container;
  var slice = Array.prototype.slice;
  var msgs = [];
  function logger(msg, color) {
    msgs.push({msg: msg = delta() + msg, color: color});
    if (typeof console !== 'undefined') console.log(msg);

    if (!$container) return;

    flush();
  }

  function flush() {
    var msg;
    while (msg = msgs.shift()) {
      var div = d.createElement('div');
      if (msg.color) div.style.color = msg.color;
      div.appendChild(d.createTextNode(msg.msg));
      $container.appendChild(div);
    }
  }

  var levels = {log: 2, trace: 0, debug: 1, info: 2, warn: 3, error: 4, fatal: 5};
  for (var i in levels) levels[levels[i]] = i;
  var $level = levels.info;

  var log   = function () { if ($level <= levels.info)  logger('info - ' + slice.call(arguments).join(' '), null); };
  log.trace = function () { if ($level <= levels.trace) logger('trace- ' + slice.call(arguments).join(' '), '#00f'); };
  log.debug = function () { if ($level <= levels.debug) logger('debug- ' + slice.call(arguments).join(' '), '#088'); };
  log.info  = log;
  log.warn  = function () { if ($level <= levels.warn)  logger('warn - ' + slice.call(arguments).join(' '), '#f60'); };
  log.error = function () { if ($level <= levels.error) logger('error- ' + slice.call(arguments).join(' '), '#f00'); };
  log.fatal = function () { if ($level <= levels.fatal) logger('fatal- ' + slice.call(arguments).join(' '), '#f0f'); };

  log.level = function (level) {
    if (level == null) return levels[$level];

    if (typeof level === 'number' && level >= 0 && level <= 5)
      return $level = level, levels[$level];

    if (typeof level === 'string' && levels.hasOwnProperty(level))
      return $level = levels[level];

    return levels[$level];
  };

  log.container = function (container) {
    $container = d.createElement('pre');
    container.appendChild($container);
    flush();
  };

  w.log = log;
})(window, document);
