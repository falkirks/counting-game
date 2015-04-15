/* **************** */
var currentNumber = 0;
/* **************** */

var express = require('express'),
    fs = require('fs'),
	exphbs = require('express-handlebars'),
    moment = require('moment'),
    request = require('request');
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var oldClicker = false;
var lastClicker = false;
var isClicking = false;
var nextClickTimeout = null;

var connectedCount = 0;

app.engine('handlebars', exphbs({}));
app.set('view engine', 'handlebars');
app.set('port', (process.env.PORT || 5000));
app.get('/', function (req, res) {
    res.render('main', {user: req.user});
});
app.use(express.static("assets"));
http.listen(app.get('port'), function () {
    console.log("counting game is running on port " + app.get('port'))
});
io.on('connection', function(socket){
    connectedCount++;
    socket.emit("number", {setTo: currentNumber, isRestart: false});
    socket.on('start click', function(data){
        if(!isClicking){
            if(serializeSocket(socket) !== lastClicker) {
                lastClicker = serializeSocket(socket);
                isClicking = true;
                nextClickTimeout = setTimeout(function(){
                    oldClicker = lastClicker;
                    isClicking = false;
                    currentNumber++;
                    io.emit("number", {setTo: currentNumber, isRestart: false});
                }, 500);
            }
        }
        else{
            currentNumber = 0;
            oldClicker = false;
            lastClicker = false;
            isClicking = false;
            io.emit("number", {setTo: currentNumber, isRestart: true});
        }
    });
    socket.on('stop click', function(data){
        if(serializeSocket(socket) == lastClicker && isClicking) {
            lastClicker = oldClicker;
            isClicking = false;
            clearTimeout(nextClickTimeout);
        }
    });
    io.emit("game stats", {swarmCount: connectedCount});
});
io.on('disconnect', function() { connectedCount--; });
function serializeSocket(socket){
    return process.env.PORT != null ? socket.handshake.address.address : socket.id; //TODO add an env variable to detect heroku
}