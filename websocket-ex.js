// websocket-ex.js

'use strict';

// require
var fs = require('fs');
var http = require('http');
var util = require('util');
var path = require('path');
var LogManager = require('log-manager');
LogManager.setLevel('trace');
var log = LogManager.getLogger();

// config.txt
var config = eval('(' + fs.readFileSync('./config.txt') + ')');
var port = config.port;

// mime types
var mimeTypes = eval('(' + fs.readFileSync('./mime-types.txt') + ')');

var pid = process.pid;

// server
var server = http.createServer(function (req, res) {
  var socket = req.socket || req.connection;
  var startTime = Date.now();
  var loc = req.url === '/' ? 'index.html' : req.url;
  if (loc === '/xhr/') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/json');
    if (req.method === 'POST') req.pipe(res);
    else res.end();
    return;
  }
  var ext = loc.slice(loc.lastIndexOf('.')).slice(1) || 'txt';
  var type = mimeTypes[ext] || mimeTypes['txt'];
  var fileName = path.join(__dirname, loc);
  res.setHeader('Content-Type', type);
  res.setHeader('Cache-Control', 'max-age=10');
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
    logger.call(log, '%s: %d ms\t%s %s', res.statusCode,
        Date.now() - startTime, req.method, req.url);
  }); // fs.stat
}); // http.createServer

//server.on('upgrade', 

server.listen(port, function () {
  log.info('Server running at http://localhost:%d', port);
});

var socketNo = 0;
server.on('connection', function (socket) {
  socket.$socketNo = pid + '#' + (++socketNo);
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
    log.debug('$socketNo: ' + socket.$socketNo);
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
            connection.sendUTF(message.utf8Data);
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
