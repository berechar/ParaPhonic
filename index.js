/* Server */

const express = require('express')
const app = express()
var http = require('http').Server(app)
var io = require('socket.io')(http)

// Keep track of seperates users and their voices
const MAX_VOICES = 4
var voices = Array(MAX_VOICES).fill(0)
var users = {}

var total_connections = 0,
	id = 0

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


/*
 * User Connection
 *
 * 
 *
 */

io.on('connection', function(socket){
	console.log('[user connected]')

	var name = "user#" + id
	var voice = getVoice(voices)

	id++
	total_connections++
	voices[voice]++

	users[name] = {											// assign voice to user
		index: total_connections,
		voice: voice
	}

	// notify all clients of the new amount of connections

	io.emit("total", total_connections);

	// update client

	socket.emit("voice", voice);
	socket.emit("index", total_connections);

	socket.on('disconnect', function(){
		console.log('[user disconnected]')

		var user = users[name]
		var voice = user.voice 								// get voice
		voices[voice]--										// and decrement it

		users[name] = null									// remove the user

		total_connections--									// update the total connections
				
		io.emit("disconnection", {							// notify everyone that we lost a connection
			user,											// and that they should update their indices
			total_connections 								// and their total number
		});
	})
})

http.listen(3000, function(){
	console.log('Listening on *:3000')
})

function getVoice(voices){
	// find the voice which is chosen the least

	// get the lowest value of all voices
	var min = voices.reduce( (a,b,i) => a[0] > b ? [b,i] : a, [Number.MAX_VALUE,-1])[0]

	// get set of indexes whose value is the lowest
	var lowest = []

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