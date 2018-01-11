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

http.listen(3000, function(){
	console.log('Listening on *:3000')
})

if(CONFIG.DEV != 'dev'){
	// when do we know that we have we-mote connection
	// and can set a default color after boot-up

	var boot = clocks.buildInterval(function(){
		pyropanda.ping(function(resp){

			if(resp == '{\'result\':\'ok\'}') {
				console.log("successfull ping to pyropanda")
				clearInterval(boot)

				// do start-up animation
				//startDefaultColorWheel()

				startBlackToWhiteFade()
			}
		})
	}, 1000)

}



// Whenever someone joins for the first time
// flash their light for 5 seconds
// then start the color wheel from their colour to the other participants

// 1. Get to know which users are joined
// 2. Find out their colors

function startActiveColorWheel(){
	clocks.clearIntervals()

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

		// add the first color to the end for infinite loop
		colors.push(colors[0])

		return colors
	}

	var interval = clocks.buildColorWheelInterval(getActiveColors(), 100, 100, function(color){
		console.log(color)
		pyropanda.solid(color)
	})

	clocks.addInterval(interval)
}

function startDefaultColorWheel(){
	clocks.clearIntervals()

	var idleColors = CONFIG.COLORS
	idleColors.push(CONFIG.COLORS[0])

	var interval = clocks.buildColorWheelInterval(idleColors, 100, 100, function(color){
		pyropanda.solid(color)
	})

	clocks.addInterval(interval)
}

function startBlackToWhiteFade(){
	var index = 0
	
	var whiteFade = clocks.buildInterval(function(){
		if(index < 9){
			index++
		}else{
			clearInterval(whiteFade)
		}

		var color = index.toString().repeat(8)
		pyropanda.solid(color)
		
	}, 20)
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
	})

	socket.on("joined", function(){
		startSinging()
	})

	socket.on("resume", function(){
		startSinging()
	})

	socket.on("left", function(){
		total_singers--

		users[name].active = true

		io.emit("total", total_singers)					// notify all clients of the new amount of singers	
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

		clocks.clearIntervals()
		clocks.clearTimeouts()

		pyropanda.solid(getColor(voice))

		var update = clocks.buildTimeout(function(){
			if(total_singers >= 2){
				//startActiveColorWheel()
			}
		}, 3000)

		clocks.addTimeout(update)
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

/**
 * Logging
 *
 */

 setInterval(function(){
	console.log('[tick]')
}, 1000)

function logConnection(user){
	console.log('[user connected]')
}

function logDisconnection(user){
	console.log('[user disconnected]')
}