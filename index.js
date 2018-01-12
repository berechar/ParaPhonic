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

var voices = Array(CONFIG.MAX_VOICES).fill(0)
var users = {}
var total_connections = 0
var total_singers = 0
var id = 0

// NodeJS is being run as a deamon, therefore refer directly to the folder

if(CONFIG.ENV == 'dev'){
	app.use(express.static('public'))
}else{
	app.use(express.static('/home/someone/workspace/paradiso/public'))
}

// serve default page

app.get('/', function(req, res){
	res.sendFile(__dirname + '/index.html')
})

// default light setting

if(CONFIG.ENV != 'dev'){

	// ping to pyropanda every second
	// to do an initial boot

	var boot = clocks.buildInterval(function(){
		console.log('Ping to pyropanda')

		pyropanda.ping(function(resp){

			if(resp == '{\'result\':\'ok\'}') {
				console.log("Succeeded to ping to pyropanda")
				clearInterval(boot)

				pyropanda.solid('111111')

				/*
				 * Rotate Motor1 for infinite length
				 *
				 */

				var second = 1000
				var time = second * 60
				var refreshRate = time - second

				console.log("Start rotating motor1 for " + time + 'ms')

				pyropanda.motor1(time)
				pyropanda.motor2(time)

				setInterval(function(){
					console.log('Interval: rotating motor1 for ' + time + 'ms')

					pyropanda.motor1(time)
					pyropanda.motor2(time)
				}, refreshRate)

				return false
			}

			console.log("Failed to ping to pyropanda: trying again in 2s")
		})
	}, 2000)
}


/**
 * Setup ticker 
 *
 */

var ticker = require('./src/ticker.js')
ticker.init()

ticker.metro(function(counter, v){
	// 1, 2, 3, 4, 5, 6, 7, 8, ...
	// 1, 2, 1, 4, 1, 2, 1, 8, ...

	// one cycle
	if(counter > 60){		
		var arr = getUsersAsArray()
		var active = []

		if(arr.length == 0){
			return false
		}

		// fetch colors of active users
		arr.forEach(function(u){
			if(u != null && u.active){
				active.push(u)
			}
		})

		if(active.length <= 0){
			return false
		}

		var index = Math.floor(Math.random() * Math.floor(active.length))
		var user = active[index]

		//console.log('notify user to do a fragment')

		io.to(user.socketId).emit('bang', v)

		ticker.reset()
	}

})


/*
 * User Connection
 *
 */

io.on('connection', function(socket){
	var name = "user#" + id
	var index = total_connections + 1
	var voice = getVoice(voices)
	var active = false
	var socketId = socket.id

	// save this user
	users[name] = {
		name,
		index,
		voice,
		active,
		socketId
	}

	logConnection(users[name])

	// update client with voice number and total connections

	socket.emit("init", index, voice)

	// update server variables

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
		updatePyroPanda()
	})

	socket.on("joined", function(){
		startSinging()
	})

	socket.on("resume", function(){
		startSinging()
	})

	socket.on("left", function(){
		total_singers--

		if(total_singers < 0){
			total_singers = 0
		}

		users[name].active = false						// make the user not active

		io.emit("total", total_singers)					// notify all clients of the new amount of singers	

		updatePyroPanda()
	})

	function startSinging(){
		total_singers++									// increment the amount of active singers

		users[name].index = total_singers				// save it to this user (used when disconnecting)
		users[name].active = true						// and make it active to pick up it's color for pyropanda

		socket.emit("index", total_singers)				// notify the client of the index

		io.emit("total", total_singers)					// notify all clients of the new amount of singers

		if(total_singers == 1){							// reset ticker if this is the first connection
			ticker.reset()
		}

		updatePyroPanda(getColor(voice))
	}

	function updatePyroPanda(color){
		clocks.clearIntervals()

		var time = 0

		if(color != null){
			pyropanda.solid(color)
			time = 1000						// time to wait before starting the interval with all colors
		}

		//return false

		setTimeout(function(){
			var interval = clocks.buildColorInterval(getActiveColors(), 8000, function(color){
				pyropanda.solid(color)
			})

			clocks.addInterval(interval)
		}, time)

	}
})

http.listen(3000, function(){
	console.log('Listening on *:3000')
})

/**
 * Utilities
 *
 */

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

function getUsersAsArray(){
	return Array.from(Object.keys(users), k=>users[k]);
}

function getActiveColors(){
	// get users as array
	var arr = getUsersAsArray()
	var colors = []

	// fetch colors of active users
	arr.forEach(function(u){
		if(u != null && u.active){
			colors.push(getColor(u.voice))
		}
	})

	// have always a light on
	if(colors.length == 0){
		colors.push('111111')
	}

	return colors
}

/**
 * Logging
 *
 */

function logConnection(user){
	console.log('[user connected]')
	console.log(user.name)
}

function logDisconnection(user){
	console.log('[user disconnected]')
	console.log(user.name)
}