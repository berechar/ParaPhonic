import './main.scss'
import { sketch, startAudio, stopAudio } from './sketch'
import io from 'socket.io-client'
var CONFIG = require('./config.js')

var loc = 'http://localhost:3000'

if(CONFIG.ENV != 'dev') {
	loc = 'http://192.168.42.1'
}

var socket = io(loc, {
	forceNew: true    // changed all totals...
})

var index = 0,
	total = 0,
	voice = 0,
	joined = false


/**
 * Initalize page
 *
 */


socket.on("init", function(i, v) {

	// clear default classes
	document.body.className = ''

	index = i
	total = i

	voice = v

	updateVoiceUI(v)

	updateUI()
	
})


/**
 * Update the index
 *
 */


socket.on("index", function(i) {

	index = i

	updateUI()
	
})


/**
 * Update the total
 *
 */


socket.on("total", function(i) {
	total = i

	if(index > total){
		index--
	}

	updateUI()
})


/**
 * React when a disconnection takes place
 *
 */


socket.on("disconnection", function(data) {
	if(index >= data.user.index) {
		index--
	}

	total = data.total_singers

	updateUI()
})


/**
 * DOM events
 *
 * Enter the player
 *
 */


var enter = document.getElementById('enter')

enter.addEventListener('click', function(e){
	e.preventDefault()

	document.body.classList.add('is-soundbox')

	if(!joined){
		socket.emit('joined')
		document.getElementById('svg_label').innerHTML = 'resume'

		joined = true
	}else{
		socket.emit('resume')
	}

	// the sketch is by default paused to prevent sound from home
	// and start the audio files from the beginning

	startAudio()

	return false
})


/**
 * Return to home
 *
 */


var returnHome = document.getElementById('return')

returnHome.addEventListener('click', function(e){
	e.preventDefault()

	document.body.classList.remove('is-soundbox')

	socket.emit("left")

	stopAudio()

	return false
})

function updateUI() {
	document.getElementById('index').innerHTML = index
	document.getElementById('total').innerHTML = total
}

function updateVoiceUI(v){
	document.body.classList.add('is-voice-' + v)
}

function callbackFromSketch(){
	document.body.classList.add('is-ready')
}

sketch(socket, callbackFromSketch)