var
    path = require('path'),
    fs = require('fs'),
    nowjs = require("now"),
    express = require("express"),
    redislib = require("redis"),
    util = require("util"),
	url = require("url"),
    WEBROOT = path.join(path.dirname(__filename), '/webroot');

if (process.env.REDISTOGO_URL) {
	var rtg   = url.parse(process.env.REDISTOGO_URL);
	var redis = redislib.createClient(rtg.port, rtg.hostname);
	redis.auth(rtg.auth.split(":")[1]);
} else {
	var redis = require("redis").createClient();
}


//Create express server
var server = express.createServer();
//Define static files
server.use('/static',express.static(WEBROOT));
//Define route for the homepage
server.get('/',function(req, response){
	console.log(req.headers['user-agent']);
	if(/mobile/i.test(req.headers['user-agent'])) {
		fs.readFile(WEBROOT+'/mobile/home.html', function(err, data){
	        response.writeHead(200, {'Content-Type':'text/html'});
	        response.write(data);
	        response.end();
	    });
	} else {
	    fs.readFile(WEBROOT+'/index.html', function(err, data){
	        response.writeHead(200, {'Content-Type':'text/html'});
	        response.write(data);
	        response.end();
	    });
	}
});
//Define route for a playlist
server.get('/playlist/*',function(req, response){
    fs.readFile(WEBROOT+'/playlist.html', function(err, data){
        response.writeHead(200, {'Content-Type':'text/html'});
        response.write(data);
        response.end();
    });
});

//Define route for a playlist
server.get('/mobile/*',function(req, response){
    fs.readFile(WEBROOT+'/mobile/index.html', function(err, data){
        response.writeHead(200, {'Content-Type':'text/html'});
        response.write(data);
        response.end();
    });
});
var port = process.env.PORT || 8080;
server.listen(port);
//var everyone = nowjs.initialize(server, { socketio: { transports: [] } });
var everyone = nowjs.initialize(server, { socketio: { transports: ["htmlfile", "xhr-polling", "jsonp-polling"] } } );


//CHANGE OWNERSHIP
everyone.now.iWantToBeThePlayer = function() {
    util.log("iWantToBeThePlayer");
    var group = nowjs.getGroup(this.now.roomID);
    var clientId = this.user.clientId;
    // Check if the player asking is not already the current player
    if (clientId !== group.player) {
        // If there is no current player, the client becomes the player
        if (!group.player) {
            this.now.youAreThePlayerNow();
            group.player = this.user.clientId;
            util.log("New player: " + playerId);
        }
        // Otherwise ask the current player if he agrees on changing
        else {
            nowjs.getClient(group.player, function() {
                this.now.someoneWantsToBeThePlayer(clientId);
            });
        }
    }
}

everyone.now.changeThePlayerTo = function(playerId) {
    util.log("changeThePlayerTo: " + playerId);
    this.now.youAreNotTheCurrentPlayer();
    var group = nowjs.getGroup(this.now.roomID);
    nowjs.getClient(playerId, function() {
        this.now.youAreThePlayerNow();
        group.player = playerId;
        util.log("New player: " + playerId);
    });
}



//Connect and disconnect functions, group managers
everyone.on('connect', function() {
    joinGroup(this.now.roomID, this);
    redis_get('playlist:'+this.now.roomID,this.now.setup)
});

everyone.on('disconnect', function() {
    var group = nowjs.getGroup(this.now.roomID);
    if (group.player == this.user.clientId) {
        group.player = null;
    }
});


function joinGroup(groupId, client) {
    // Add a user to a group
    var group = nowjs.getGroup(groupId);

    if (!group.player) {
        group.player = client.user.clientId;
        nowjs.getClient(group.player, function() {
            this.now.youAreTheCurrentPlayer();
        });
    }

    util.log(group.player);

    if (!group.now.amITheCurrentPlayer) {
        group.now.amITheCurrentPlayer = function() {
            if (nowjs.getGroup(this.now.roomID).player == this.user.clientId) {
                this.now.youAreTheCurrentPlayer();
            }
            else {
                this.now.youAreNotTheCurrentPlayer();
            }
        }
    }

    group.addUser(client.user.clientId);
    util.log("Client " + client.user.clientId + " was added to group " + groupId);
}


//API
everyone.now.pause = function(){
    nowjs.getGroup(this.now.roomID).now.receivePause()
}

everyone.now.play = function(){
    nowjs.getGroup(this.now.roomID).now.receivePlay()
}

everyone.now.nextSong = function(){
    roomID = this.now.roomID;
    redis_get("playlist:"+roomID, function(data) {
        data = JSON.parse(data);
        next = data.current + 1;
        util.log("next . next = " + next);
        if (next >= data.playlist.length) {
            next = 0;
        }
        data.current = next;
        set_playlist(roomID, JSON.stringify(data));
    });
    nowjs.getGroup(roomID).now.receiveNextSong()
}

everyone.now.previousSong = function(){
    roomID = this.now.roomID;
    redis_get("playlist:"+roomID, function(data) {
        data = JSON.parse(data);
        prev = data.current - 1;
        if (prev < 0) {
            prev = data.playlist.length;
        }
        data.current = prev;
        set_playlist(roomID, JSON.stringify(data));
    });
    nowjs.getGroup(roomID).now.receivePreviousSong()
}

everyone.now.updateTime = function(seconds){
    nowjs.getGroup(this.now.roomID).now.receiveUpdateTime(seconds)
}

everyone.now.updatePlaylist = function(data){
    set_playlist(this.now.roomID, data);
    nowjs.getGroup(this.now.roomID).now.receiveUpdatePlaylist(data);
}

everyone.now.updateVolume = function(volume){
    nowjs.getGroup(this.now.roomID).now.receiveUpdateVolume(volume)
}

//REDIS
redis.on("error", function (err) {
    console.log("Redis connection error to " + redis.host + ":" + redis.port + " - " + err);
});


var redis_get= function(key,callback){
    //Asyncronous Get Wrapper for redis
    redis.GET(key, function(err, res){
        callback(res);
    });
}

function set_playlist(ID,playlist){
    redis.SET('playlist:'+ID,playlist);
}

