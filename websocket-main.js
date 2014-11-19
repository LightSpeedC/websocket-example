// main.js
(function (w) {
  'use strict';

/*
  function dumpObj(obj, name) {
    for (var i in obj) {
      try {
        var el = obj[i];
        if (typeof el === 'function') el = 'function';
        else el = JSON.stringify(el);
        log(name + '.' + i + ' = ' + el); }
      catch (e) { } //log(name + '.' + i + ' ' + e); }
    }
  }
*/

  function newXHR(cb) {
    var xhr = typeof XMLHttpRequest === 'function' ? new XMLHttpRequest() :
    function () {
      try { return new ActiveXObject("Msxml2.XMLHTTP.6.0"); } catch (e) {}
      try { return new ActiveXObject("Msxml2.XMLHTTP.3.0"); } catch (e) {}
      try { return new ActiveXObject("Microsoft.XMLHTTP"); } catch (e) {}
      return null;
    } (); // xhr
    var que = [];
    if (!xhr) return log.warn('xhr is null'), null;
    var obj = {get:  function (url) { que.push(['GET',  url]); next(); },
               post: function (url, data) { que.push(['POST', url, data]); next(); }};
    xhr.onreadystatechange = function() {
      if (xhr.readyState == 4) { // DONE
        if (xhr.status == 200) cb.call(obj, null, xhr.responseText);
        else cb.call(obj, xhr.status);
        next();
      }
    };
    return obj;
    function next() {
      if (xhr.readyState !== 4 && xhr.readyState !== 0) return;
      var el = que.shift();
      if (!el) return;
      var data = el[2];
      if (typeof data !== 'string')
        data = JSON.stringify(data);
      xhr.open(el[0], el[1], true);
      xhr.send(data);
    }
  };

  var url = location.protocol + '//' + location.host + '/xhr/';
  function xhrcb(err, data) {
    try {
      log.trace('xhr recv data:', data);
      var data = JSON.parse(data);
      if (data.cid && data.cid !== clientId) {
        log.warn('xhr cid: ' + clientId + ' -> ' + data.cid);
        clientId = data.cid;
        if (data.cno > clientNo) clientNo = data.cno;
      }
      switch (data.msg) {
        case 'conn':
          log.trace('xhr send 1');
          this.post(url, {msg: "msg1", data: "xhr msg1", cid: clientId, cno: ++clientNo});
          break;
        case 'msg1':
          log.trace('xhr send 2');
          this.post(url, {msg: "msg2", data: "xhr msg2", cid: clientId, cno: ++clientNo});
          break;
        case 'msg2':
          log.trace('xhr send 3');
          this.post(url, {msg: "msg3", data: "xhr msg3", cid: clientId, cno: ++clientNo});
          break;
      }
    } catch (e) { log.error('xhr Error:', e.message); }
  }
  log.trace('xhr newXHR() start');
  var xhr = newXHR(xhrcb); // xhr
  log.trace('xhr newXHR() complete');
  //xhr.setRequestHeader('Content-Type', 'text/plain');
  xhr.post(url, {msg:"conn", data: "xhr msg0", cid:clientId, cno:0});
  log.trace('xhr send conn');

  var wsurl = 'ws://' + location.host + '/ws/';
  try {
    log.debug('ws new WebSocket() start');
    var ws = new WebSocket(wsurl, 'echo-protocol');
    log.debug('ws new WebSocket() complete');
    ws.onopen = function () {
      log.debug('ws onopen!');
      ws.send(JSON.stringify({msg:"conn", data: "ws msg0", cid:clientId, cno:0}));
      log.debug('ws send conn');
    };
    ws.onmessage = function (event) {
      log.debug('ws recv data:', event.data);
      var data = JSON.parse(event.data);
      if (data.cid && data.cid !== clientId) {
        log.warn('ws cid: ' + clientId + ' -> ' + data.cid);
        clientId = data.cid;
        clientNo = data.cno + 1;
      }

      switch (data.msg) {
        case 'conn':
          log.debug('ws send 1');
          ws.send(JSON.stringify({msg: "msg1", data: "ws msg1", cid: clientId, cno: ++clientNo}));
          break;
        case 'msg1':
          log.debug('ws send 2');
          ws.send(JSON.stringify({msg: "msg2", data: "ws msg2", cid: clientId, cno: ++clientNo}));
          break;
        case 'msg2':
          log.debug('ws send 3');
          ws.send(JSON.stringify({msg: "msg3", data: "ws msg3", cid: clientId, cno: ++clientNo}));
          break;
      }
    };
    ws.onclose = function () { log.debug('ws closed'); };
    ws.onerror = function () { log.error('ws error'); };
    // ws.close();
  } catch (e) {
    log.error('using WebSocket - Error:', e.message);
  }

  log('end of index.html');
})(window);
