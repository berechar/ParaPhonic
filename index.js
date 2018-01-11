/* Server */

const express = require('express')
const app = express()
var http = require('http').Server(app)
const cs = require('color-stepper')

const CONFIG = require('./src/config.js')
const pyropanda = require('./src/pyropanda.js')
const clocks = require('./src/clocks.js')

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
var total_singers = 0
var id = 0

// serve default page

app.get('/', function(req, res){
	res.sendFile(__dirname + '/index.html')
})

// default light setting

if(CONFIG.DEV != 'dev'){
	// when do we know that we have we-mote connection
	// and can set a default color after boot-up

	var boot = clocks.buildInterval(function(){
		pyropanda.ping(function(resp){

			if(resp == '{\'result\':\'ok\'}') {
				console.log("successfull ping to pyropanda")
				clearInterval(boot)

				pyropanda.solid('FFFFFF')
			}
		})
	}, 1000)
}



	function getActiveColors(){
		// get users as array
		var arr = Array.from(Object.keys(users), k=>users[k]);
		var colors = []

		// fetch colors of active users
		arr.forEach(function(u){
			if(u != null && u.active){
				colors.push(getColor(u.voice))
			}
		})

		// have always a light on
		if(colors.length == 0){
			colors.push('FFFFFF')
		}

		return colors
	}


/*
 * User Connection
 *
 */

io.on('connection', function(socket){
	var name = "user#" + id
	var index = total_connections + 1
	var voice = getVoice(voices)
	var active = false

	// save this user
	users[name] = {
		name,
		index,
		voice,
		active
	}

	logConnection(users[name])

	// update client with voice number and total connections

	socket.emit("init", index, voice)
	

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
		total_singers--

		if(total_singers < 0){
			total_singers = 0
		}
		
		io.emit("disconnection", {
			user,
			total_singers
		});

		// remove the user
		users[name] = null

		// and update the colors
		updateColors()
	})

	socket.on("joined", function(){
		startSinging()
	})

	socket.on("resume", function(){
		startSinging()
	})

	socket.on("left", function(){
		total_singers--

		users[name].active = false

		io.emit("total", total_singers)					// notify all clients of the new amount of singers	

		updateColors()
	})

	function startSinging(){
		total_singers++									// increment the amount of active singers

		users[name].index = total_singers				// save it to this user (when disconnecting)
		users[name].active = true

		socket.emit("index", total_singers)				// notify the client of the index

		io.emit("total", total_singers)					// notify all clients of the new amount of singers

		/**
		 *  Color magic
		 *
		 */

		updateColors(getColor(voice))
	}

	function updateColors(color){
		clocks.clearIntervals()

		var time = 0

		if(color != null){
			pyropanda.solid(color)
			time = 1000
		}

		setTimeout(function(){
			var interval = clocks.buildColorInterval(getActiveColors(), 600, function(color){
				pyropanda.solid(color)
			})

			clocks.addInterval(interval)
		}, time)
	}
})


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
	return CONFIG.COLORS[index]
}

http.listen(3000, function(){
	console.log('Listening on *:3000')
})

/**
 * Logging
 *
 */

 setInterval(function(){
	//console.log('[tick]')
}, 1000)

function logConnection(user){
	console.log('[user connected]')
}

function logDisconnection(user){
	console.log('[user disconnected]')
}