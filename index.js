/* Server */

const express = require('express'),
	app = express(),
	http = require('http').Server(app)

var io = require('socket.io')(http, {
	pingInterval: 1000,									// pingInterval (Number): how many ms before sending a new ping packet (25000).
	pingTimeout: 1000									// pingTimeout (Number): how many ms without a pong packet to consider the connection closed (60000)
})


const CONFIG = require('./src/config.js'),
	pyropanda = require('./src/pyropanda.js'),
	clocks = require('./src/clocks.js')
	util = require('./src/util.js')


var voices = Array(CONFIG.MAX_VOICES).fill(0)
var users = {}
var total_singers = 0



// NodeJS is being run as a deamon on the Pi, therefore it's more secure to write out the path to the public folder

if(CONFIG.ENV == 'dev'){
	app.use(express.static('public'))
}else{
	app.use(express.static('/home/someone/workspace/paradiso/public'))
}


// Start listening

http.listen(3000, function(){
	console.log('Listening on *:3000')
})


// Default route

app.get('/', function(req, res){
	res.sendFile(__dirname + '/index.html')
})


/**
 *
 * PRODUCTION BOOTING PROCEDURE
 *
 * When in production, the order of booting and synching the several components is crucial
 *
 * We need to make sure that the state of the installation is in order before we start running our front-end code
 *
 * The following order is happening:
 *
 * 1     The box is powered by electricity
 * 2     The Raspberry Pi 3 and WeMos Controller are booting up
 * 3     The WeMos controllor is ready and runs a test LED pattern to check the lights
 *
 * 4a
 *     1     The Pi starts the WiFi Access Point (PolyPhonic) and starts the NodeJS server
 *     2     The server tries to make a request to the WeMos controller Pyropanda (and probably fails)
 *     3     When the server succeeds, it sends the default settings for the electronics
 *
 * 4b
 *     1     The WeMos controller starts trying to connect to the WiFi Access Point of the Pi (PolyPhonic)
 *     2     When the WeMos succeeds in establishing a connection with the WiFi AP, it runs a pattern of 3 flashes of red light
 *
 *
 * Thus
 *
 * 1     When is there a connection with PyroPanda?
 * 2     How can we be sure that we are the only one sending messages (and not being in-the-middle of any test patterns)?
 *
 *
 * Solution
 *
 * 1     Send a dummy request to the WeMos controller every Xs and wait until there is a successfull response
 * 2     Wait Xs for being sure that we are the last one sending any requests
 *
 */


if(CONFIG.ENV != 'dev') {

	console.log("Production environment")

	if(CONFIG.SKIP_PANDA){
		connectIO_defaultSettings();
		return false
	}

	var intervalTime = CONFIG.PING_INTERVAL
	var timeOut = CONFIG.PING_TIMEOUT

	var ping = clocks.buildInterval(function() {
		console.log('Ping to pyropanda')

		pyropanda.ping(function(resp) {

			if(resp == '{\'result\':\'ok\'}') {
				console.log("Succeeded to ping to pyropanda")
				console.log('Start ParaPolyPhonicDiso Socket.IO connections in 5s')

				// destroy this interval
				clearInterval(ping)

				setTimeout(function(){

					// continou connection
					connectIO_defaultSettings();

				}, timeOut)

				return false
			}

			console.log('Failed to ping to pyropanda: trying again in ' + intervalTime + 'ms')
		})

	}, intervalTime)

} else {
	
	console.log("Development environment")
	
	connectIO_defaultSettings()

}

function connectIO_defaultSettings(){

	// set inital color
	pyropanda.solid(CONFIG.DEFAULT_LED_COLOR)


	// connect Socket.IO events to the server

	connectIO()


	/*
	 * Rotate Motors for infinite length
	 *
	 */

	if(!CONFIG.INFINITE_MOTORS) {
		return false
	}

	var second = 1000
	var time = second * 60
	var refreshRate = time - second

	// first spin
	runMotorsInifinitly()

	// repeated spin
	setInterval(function(){
		runMotorsInifinitly()
	}, refreshRate)


	function runMotorsInifinitly(){
		console.log("Start rotating motor1 and motor2 for " + time + 'ms')

		pyropanda.motor1(time)
		pyropanda.motor2(time)
	}
}


/**
 * Setup ticker 
 *
 */

/*

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

*/


/*
 * User Connection
 *
 */


function connectIO(){
	console.log("Called connectIO()")

	io.on('connection', function(socket){
		var id = socket.id

		connect(socket, id);

		socket.on('disconnect', function(){
			disconnect(users, id)
		})

		socket.on("joined", function(){
			joinTheChoir(socket, users[id])
		})

		socket.on("resume", function(){
			joinTheChoir(socket, users[id])
		})

		socket.on("left", function(){
			leaveTheChoir(users[id])
		})

		socket.on("ready", function(){
			if(CONFIG.DEBUG) {
				console.log('Sketch loaded and ready')
			}
		})
	})	
}

function connect(socket, id){
	console.log('User connected')

	var id = id
	var index = total_singers
	var voice = util.getVoice(voices)
	var active = false


	// save this user

	users[id] = {
		id,
		index,
		voice,
		active
	}

	socket.emit("boot", users[id])

	// update server variables

	voices[voice]++
}

function disconnect(users, id){
	// get the disconnected user
	var user = users[id]

	console.log('User disconnected')

	// update server variables

	voices[user.voice]--


	// if the user was singing (thus active), decrement the total_singers and update every active indices

	if(user.active) {
		total_singers--

		io.emit("total", total_singers)

		updateUserIndices(user)
	}


	// remove the user

	users[id] = null


	// and update the colors

	updatePyroPanda()
}

function leaveTheChoir(user) {
	user.active = false								// make the user not active
	updateUserIndices(user)							// and update all users and their indices

	total_singers--									// update the total amount of singers
	io.emit("total", total_singers)


	// and update the colors

	updatePyroPanda()
}

function updateUserIndices(paused_user) {
	// update all indices of all users
	// and broadcast them to the clients

	var arr = util.getObjAsArray(users)
	var _index = paused_user.index

	arr.forEach(function(u) {
		if(u != null && u.active) {
			var id = u.id
			var index = u.index

			if(index > _index){
				index -= 1

				// save it
				users[id].index = index

				// broadcast it
				io.to(id).emit("index", index)
			}
		}
	})
}


function joinTheChoir(socket, user){
	total_singers++									// increment the amount of active singers

	user.index = total_singers						// save it to this user (used when disconnecting)
	user.active = true								// and make it active to pick up it's color for pyropanda

	socket.emit("index", total_singers)				// notify the client of the index
	io.emit("total", total_singers)					// notify all clients of the new amount of singers
	

	/*
	if(total_singers == 1){							// reset ticker if this is the first connection
		ticker.reset()
	}
	*/

	updatePyroPanda(util.getColor(user.voice))
}

/**
 * Utilities
 *
 */

function getSingingColors() {
	// get users as array

	var arr = util.getObjAsArray(users)
	var colors = []


	// fetch colors of active users

	arr.forEach(function(u) {

		if(u != null && u.active) {
			var color = util.getColor(u.voice)
			colors.push(color)
		}

	})


	// have always a light on

	if(colors.length == 0) {
		colors.push(CONFIG.DEFAULT_LED_COLOR)
	}

	return colors
}

function updatePyroPanda(color) {
	clocks.clearIntervals()

	var time = 0

	if(color != null) {

		if(CONFIG.DEBUG) {
			console.log('new color: ' + color)
		}

		pyropanda.solid(color)
		time = CONFIG.COLOR_WHEEL_NEW_TIMEOUT
	}

	if(CONFIG.COLOR_WHEEL) {

		setTimeout(function() {
			var interval = clocks.buildColorInterval(getSingingColors(), CONFIG.COLOR_WHEEL_INTERVAL, function(color) {

				if(CONFIG.DEBUG) {
					console.log('color interval: ' + color)
				}

				pyropanda.solid(color)
			})

			clocks.addInterval(interval)
		}, time)

	}
}