var http = require('http');
var path = require('path');

var async = require('async');
var socketio = require('socket.io');
var express = require('express');

var app = express();
var server = http.createServer(app);
var io = socketio.listen(server);
var stocks = {0:'GOOG'};

app.use(express.bodyParser());
app.use(express.static(path.resolve(__dirname, 'client')));

app.get('/stocks', function(req,res){
  res.json(stocks);
});

app.post('/stocks', function(req,res){
  stocks = req.body;
  res.send(req.body);
});

io.on('connection', function(client){
  console.log('Client connected...');
  
  client.on('add', function(data){
    client.broadcast.emit('add', data);
    client.emit('add', data);
  });
  client.on('remove', function(data){
    client.broadcast.emit('remove', data);
    client.emit('remove', data);
  });
});

server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function(){
  var addr = server.address();
  console.log("Server listening at", addr.address + ":" + addr.port);
});
