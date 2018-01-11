/* Server */

const express = require('express')
const app = express()
var http = require('http').Server(app)
//var request = require("request")			// request for AJAX POST request to pyropanda
const CONFIG = require('./src/config.js')

var pyropanda = require('./src/pyropanda.js')

var io = require('socket.io')(http, {
  pingInterval: 1000,						// pingInterval (Number): how many ms before sending a new ping packet (25000).
  pingTimeout: 1000							// pingTimeout (Number): how many ms without a pong packet to consider the connection closed (60000)
})

if(CONFIG.ENV == 'dev'){
	app.use(express.static('public'))
}else{
	// NodeJS is being run as a deamon, therefore refer directly to the folder
	app.use(express.static('/home/someone/workspace/paradiso/public'))
}

var voices = Array(CONFIG.MAX_VOICES).fill(0)
var users = {}
var total_connections = 0
var id = 0


var intervals = []
var timeouts = []


var buildInterval = function(fn, ms){
	return setInterval(function(){
		fn()
	}, ms)
}

var buildTimeoutToClearInterval = function(interval, ms){
	return setTimeout(function(){
		clearInterval(interval)
	}, ms)	
}

var buildColorSwitchInterval = function(ms = 500, length = 4){
	var id = 0

	return setInterval(function(){
		if(id < length - 1){
			id++
		}else{
			id = 0
		}

		console.log(id)
	}, ms)
}


//var interval = buildColorSwitchInterval(100)

/*

var intvl = buildInterval(function(){ 							// build and run interval with a function and speed
	console.log("foo")
}, 100)

var timer = buildTimeoutToClearInterval(intvl, 3000)		// run a timeout to clear the interval

*/

// serve default page

app.get('/', function(req, res){
	res.sendFile(__dirname + '/index.html')
})

// Log the booting of the server

// logBoot()

// test pyropanda

// when do we know that we have we-mote connection
// and can set a default color after boot-up

// eg. send every second a black solid
// and retrieve the result of the call, if it is a success, we are in control

// var boot = setInterval(function(){
// 	pyropanda.ping(function(resp){
// 		if(resp == '{\'result\':\'ok\'}') {
// 			console.log("successfull ping to pyropanda")
// 			clearInterval(boot)

// 			// do start-up animation

// 			pyropanda.solid("FFFFFF")
// 		}
// 	})
// }, 1000)

/*
 * User Connection
 *
 */

 pyropanda.testLED()

io.on('connection', function(socket){
	var name = "user#" + id
	var index = total_connections + 1
	var voice = getVoice(voices)

	// save this user
	users[name] = {
		name,
		index,
		voice
	}

	logConnection(users[name])

	// the sketch calls back when all audio files have been loaded
	// retrieve and return the current playheads(?)

	socket.on('callback', function(){
		//console.log('[callback from ' + name + ']')
		//console.log('return master playhead')
	})

	// update client with voice number and total connections
	socket.emit("init", index, voice)
	

	// notify all clients of the new amount of connections (which is the current index)
	io.emit("total", index)

	pyropanda.solid(getColor(voice))

	// & update server variables
	id++
	total_connections++
	voices[voice]++

	socket.on('disconnect', function(){
		// get the disconnected user
		var user = users[name]

		logDisconnection(user)

		// update server variables
		voices[voice]--
		total_connections--

		/*
		 * notify everyone that we lost a connection
		 * and that they should update their indices
		 * and their total number
		 *
		 */
		
		io.emit("disconnection", {
			user,
			total_connections
		});

		// remove the user
		users[name] = null
	})
})

http.listen(3000, function(){
	console.log('Listening on *:3000')
})

setInterval(function(){
	console.log('[tick]')
}, 1000)

function getVoice(voices){
	// return the least chosen voice(s)

	// get the lowest value of all voices
	var min = voices.reduce( (a,b,i) => a[0] > b ? [b,i] : a, [Number.MAX_VALUE,-1])[0]

	// get set of indexes whose value is the lowest
	var lowest = []

	// find out which voices all share the lowest amount of use
	for(i = 0; i < voices.length; i++){
		if(voices[i] == min){
			lowest.push(i)
		}
	}

	// get a random index from this set
	var index = Math.floor(Math.random() * lowest.length)

	// find the corresponding voice and return it
	var voice = lowest[index]

	return voice
}

function getColor(index){
	var colors = [
		'6060FF',				// blue
		'00FF00',				// green
		'FFFF00',				// yellow
		'FF0000'				// red
	]

	return colors[index]
}

/**
 * Simple logger
 *
 */

function log(line, data){
	var now = Date().toString()

	if(data != null){
		line = now + " = " + line + ":" + JSON.stringify(data);
	}else{
		line = now + " = " + line;
	}

	line += '\n'

	//fs.appendFile('log/log.txt', line, function (err) {})
}

function logBoot(){
	log("boot")
}

function logConnection(user){
	console.log('[user connected]')
	log('connection', user)
}

function logDisconnection(user){
	console.log('[user disconnected]')
	log('disconnection', user)
}