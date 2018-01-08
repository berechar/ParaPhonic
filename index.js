/* Server */

const express = require('express')
const app = express()
const fs = require('fs')
var http = require('http').Server(app)

// make socket.io available
var io = require('socket.io')(http)

// request for AJAX POST request to pyropanda
var request = require("request")

// Keep track of seperates users and their voices
const MAX_VOICES = 4
var voices = Array(MAX_VOICES).fill(0)

var users = {}

var total_connections = 0
var id = 0

// tell express to use the public folder as a static resource folder

app.use(express.static('public'))

// serve default page

app.get('/', function(req, res){
	res.sendFile(__dirname + '/index.html')
})

// serve the captive page (temporary)

app.get('/captive', function(req, res){
	res.sendFile(__dirname + '/captive.html')
})


// Log the booting of the server

logBoot()


// test the LEDs

pyroPandaTestLED()


/*
 * User Connection
 *
 */

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


	// the sketch calls back when all audio files have been loaded
	// retrieve and return the current playheads(?)

	socket.on('callback', function(){
		console.log('[callback from ' + name + ']')
	})

	// update client with voice number and total connections
	socket.emit("init", index, voice)
	

	// notify all clients of the new amount of connections (which is the current index)
	io.emit("total", index)

	// notify pyroPanda: with a color
	pyroPandaSolidLight(getColor(voice))

	setTimeout(function(){
		pyroPandaSolidLight('#000')
	}, 600)

	// & update server variables
	id++
	total_connections++
	voices[voice]++
})

http.listen(3000, function(){
	console.log('Listening on *:3000')
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
	var colors = [
		'#ff0000',
		'#00ff00',
		'#0000ff',
		'#ff00ff'
	]

	return colors[index]
}

/*
 * PyroPanda
 *
 * Send requests to PyroPanda for controlling the hardware
 */

function toPyroPanda(urlSegment = '/', data = {}){
	var url = 'http://pyropanda.local' + urlSegment

	request({
	    url: url,
	    method: "POST",
	    headers: {
	        "content-type": "application/json",
	        },
	    json: data
	}, function (error, resp, body) {
    	console.log("response from => " + body)
    })
}

function toPyroPandaMotor(id, time = 1500){
	if(id == null || id == undefined){
		return false
	}

	if(id < 0 || id > 1){
		return false
	}

	toPyroPanda('/spin', {
		'motor': {
			'id': id,
			state: 'on',
			'time': time
		}
	})
}

function pyroPandaTestLED(){
	toPyroPanda('/light/test')
}

function pyroPandaSolidLight(color = '#FF0000'){
	toPyroPanda('/light/solid', {
		'solid' : color
	})
}

function pyroPandaFadeTo(color = '#FF0000', millis = 1500){
	toPyroPanda('/light/fadeto', {
		'fadeTo': color,
		'time': millis
	})
}

function pyroPandaGradient(colors = ['#FF0000', '#00FF00'], millis = 1500) {
	toPyroPanda('/light/fadeto', {
		'style': 'linear',
		'colors': colors,
		'time': millis
	})
}

function pyroPandaMotor1(time) {
	toPyroPandoMotor(1, time)
}

function pyroPandaMotor2(time) {
	toPyroPandoMotor(2, time)
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

	fs.appendFile('log/log.txt', line, function (err) {})
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