(function (w, d) {
  'use strict';

  var methods = {
      '#': 'getElementById',
      '.': 'getElementsByClassName',
      '@': 'getElementsByName',
      '=': 'getElementsByTagName',
      '*': 'querySelectorAll'
  };

  // https://github.com/james2doyle/saltjs
  // *! Salt.js DOM Selector Lib. By @james2doyle
  w.$ = $;
  function $(selector) {
    var el = (d[methods[selector.slice(0, 1)]](selector.slice(1)));
    return ((el.length < 2) ? el[0]: el); }
})(window, document);
