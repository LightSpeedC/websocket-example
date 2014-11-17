// websocket-ex.js

'use strict';

// require
var fs = require('fs');
var http = require('http');
var util = require('util');
var path = require('path');

// custom console.log
function customLogger(log) {
  return function () {
    log('%s %s', new Date().toLocaleTimeString(), util.format.apply(util, arguments));
  };
}
console.log = customLogger(console.log);
console.info = customLogger(console.info);
console.warn = customLogger(console.warn);
console.debug = customLogger(console.debug);
console.error = customLogger(console.error);

// config.txt
var config = eval('(' + fs.readFileSync('./config.txt') + ')');
var port = config.port;

// mime types
var mimeTypes = eval('(' + fs.readFileSync('./mime-types.txt') + ')');

// server
var server = http.createServer(function (req, res) {
  var startTime = Date.now();
  var loc = req.url === '/' ? 'index.html' : req.url;
  var ext = loc.slice(loc.lastIndexOf('.')).slice(1) || 'txt';
  var type = mimeTypes[ext] || mimeTypes['txt'];
  var fileName = path.join(__dirname, loc);
  res.setHeader('Content-Type', type);
  res.setHeader('Cache-Control', 'max-age=60');
  fs.stat(fileName, function (err, stats) {
    if (err) {
      var log = console.warn;
      res.statusCode = 404;
      if (type.slice(0, 4) === 'text')
        res.end('File not found');
      else
        res.end();
    }
    else {
      var log = console.log;
      res.statusCode = 200;
      fs.createReadStream(fileName).pipe(res);
    }
    log('%s: %d ms\t%s %s', res.statusCode,
        Date.now() - startTime, req.method, req.url);
  }); // fs.stat
}); // http.createServer

//server.on('upgrade', 

server.listen(port, function () {
  console.log('Server running at http://localhost:%d', port);
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
    if (!originIsAllowed(request.origin)) {
      // Make sure we only accept requests from an allowed origin
      request.reject();
      console.log('Connection from origin ' + request.origin + ' rejected.');
      return;
    }

    var connection = request.accept('echo-protocol', request.origin);
    console.log('Connection accepted.');
    connection.on('message', function(message) {
        if (message.type === 'utf8') {
            console.log('Received Message: ' + message.utf8Data);
            connection.sendUTF(message.utf8Data);
        }
        else if (message.type === 'binary') {
            console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
            connection.sendBytes(message.binaryData);
        }
    });
    connection.on('close', function(reasonCode, description) {
        console.log('Peer ' + connection.remoteAddress + ' disconnected.');
    });
});



console.log('Server starting at http://localhost:%d', port);
