// websocket-ex.js

'use strict';

// require
var fs = require('fs');
var http = require('http');
var util = require('util');
var path = require('path');
var LogManager = require('log-manager');
//LogManager.setLevel('trace');
var log = LogManager.getLogger();

//var serverId = 'p' + process.pid.toString(36) +
//  '-t' + (+ new Date()).toString(36) +
//  '-r' + (+ Math.random().toFixed(16).slice(2)).toString(36);
var serverId = 'p' + process.pid.toString(36);
var clients = {}; // {cid,cno,sockets:[{sid,sno}]}

function msecStr(msec) {
  if (msec < 1000) return msec + ' msec';
  return (msec / 1000).toFixed(3) + ' sec';
}

// config.txt
var config = eval('(' + fs.readFileSync('./config.txt') + ')');
var port = config.port;

// mime types
var mimeTypes = eval('(' + fs.readFileSync('./mime-types.txt') + ')');

var fileList = ['log.js', 'salt.js', 'websocket-main.js'];
fileList = fileList.map(function (file) {
  return {file: file, regexp: new RegExp('<script src=\"' + file + '\"></script>', 'g'),
      script: '<script>\n' + fs.readFileSync(path.join(__dirname, file)) + '</script>\n'};
});

var htmlCache = {};
var htmlList = ['/index.html'];
htmlList = htmlList.map(function (file) {
  var fullPath = path.join(__dirname, file);
  var html = fs.readFileSync(fullPath).toString();
  fileList.forEach(function (elem) {
    html = html.replace(elem.regexp, elem.script);
  });
  return htmlCache[file] = {file: file, fullPath: fullPath, html: html};
});

//console.log(htmlCache['/index.html'].html);

// server
var server = http.createServer(function (req, res) {
  var socket = req.socket || req.connection;
  var socketId = socket.$socket.sid;
  log.debug('http socketId: ' + socketId);

  var startTime = new Date();
  var loc = req.url === '/' ? '/index.html' : req.url;
  if (loc === '/xhr/') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/json');
    if (req.method !== 'POST')
      return res.end(JSON.stringify({sid: socketId}));

    var buffs = [], bufflen = 0;
    req.on('readable', function () {
      var buff = req.read();
      if (!buff) return;
      buffs.push(buff);
      bufflen += buff.length;
    });
    req.on('end', function () {
      var buff = Buffer.concat(buffs, bufflen);
      var data = JSON.parse(buff.toString());

      var clientId = (clients[data.cid] && clients[data.cid].cid) || data.cid;
      clients[clientId] = clients[data.cid] = {cid: clientId, cno: 0};
      data.cid = clientId;
      data.cno = clients[clientId].cno = Math.max(data.cno, clients[clientId].cno);

      data.sid = socketId;
      data.sno = ++socket.$socket.sno;
      log.debug(JSON.stringify(data));
      res.end(JSON.stringify(data));
      log.info('sid: %s %s: %s\t%s %s',
        socketId, res.statusCode, msecStr(new Date() - startTime), req.method, req.url);
    });
    //req.pipe(res);
    return;
  } // /xhr/

  var ext = loc.slice(loc.lastIndexOf('.')).slice(1) || 'txt';
  var type = mimeTypes[ext] || mimeTypes['txt'];
  var fileName = path.join(__dirname, loc);
  res.setHeader('Content-Type', type);
  res.setHeader('Cache-Control', 'max-age=10');

  log.warn('loc:', loc);
  if (htmlCache[loc]) {
    res.statusCode = 200;
    res.end(htmlCache[loc].html);
    return;
  }

  fs.stat(fileName, function (err, stats) {
    if (err) {
      var logger = log.warn;
      res.statusCode = 404;
      if (type.slice(0, 4) === 'text')
        res.end('File not found');
      else
        res.end();
    }
    else {
      var logger = log.info;
      res.statusCode = 200;
      fs.createReadStream(fileName).pipe(res);
    }
    logger.call(log, 'sid: %s %s: %s\t%s %s',
        socketId, res.statusCode,
        msecStr(new Date() - startTime), req.method, req.url);
  }); // fs.stat
}); // http.createServer

//server.on('upgrade', 

server.listen(port, function () {
  log.info('Server running at http://localhost:%d', port);
});

var socketId = 0;
server.on('connection', function (socket) {
  var startTime = new Date();
  socket.$socket = {sid: serverId + '-s' + (++socketId).toString(36), sno: 0};
  log.info('sid: ' + socket.$socket.sid + ' new socket');
  socket.on('close', function () {
    log.info('sid: ' + socket.$socket.sid + ' socket close, ' + msecStr(new Date() - startTime));
  });
});


var WebSocketServer = require('websocket').server;

var wsServer = new WebSocketServer({
    httpServer: server,
    // You should not use autoAcceptConnections for production
    // applications, as it defeats all standard cross-origin protection
    // facilities built into the protocol and the browser.  You should
    // *always* verify the connection's origin and decide whether or not
    // to accept it.
    autoAcceptConnections: false
});

function originIsAllowed(origin) {
  // put logic here to detect whether the specified origin is allowed.
  return true;
}

wsServer.on('request', function(request) {
    var socket = request.socket || request.connection;
    var socketId = socket.$socket.sid;
    log.debug('ws socketId: ' + socketId);
    if (!originIsAllowed(request.origin)) {
      // Make sure we only accept requests from an allowed origin
      request.reject();
      log.trace('Connection from origin ' + request.origin + ' rejected.');
      return;
    }

    var connection = request.accept('echo-protocol', request.origin);
    log.debug('Connection accepted.');
    connection.on('message', function(message) {
        if (message.type === 'utf8') {
            log.trace('Received Message: ' + message.utf8Data);
            var data = JSON.parse(message.utf8Data);

            var clientId = socket.$clientId || data.cid;
            clientId = (clients[clientId] && clients[clientId].cid) || clientId;
            clients[clientId] = clients[data.cid] = {cid: clientId, cno: 0};
            socket.$clientId = data.cid = clientId;

            data.cno = clients[clientId].cno = Math.max(data.cno, clients[clientId].cno);

            data.sid = socketId;
            data.sno = ++socket.$socket.sno;
            connection.sendUTF(JSON.stringify(data));
        }
        else if (message.type === 'binary') {
            log.trace('Received Binary Message of ' + message.binaryData.length + ' bytes');
            connection.sendBytes(message.binaryData);
        }
    });
    connection.on('close', function(reasonCode, description) {
        log.debug('Peer ' + connection.remoteAddress + ' disconnected.');
    });
});



log.trace('Server starting at http://localhost:%d', port);
