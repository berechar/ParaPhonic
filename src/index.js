import './main.scss'
import { sketch, startAudio, stopAudio, pauseAudio } from './sketch'
import io from 'socket.io-client'

var CONFIG = require('./config.js')

var FastClick = require('fastclick');						// remove the 300ms delay between touches
FastClick.attach(document.body);

var socket = io()

var index = 0,
	total = 0,
	voice = 0,
	active = false


/**
 * Initalize page on first request and also on refresh
 *
 */

sketch(socket, callbackFromSketch)



socket.on('connect', function() {

	if(CONFIG.ENV == 'dev') {
		console.log('(Re)Connected to server')
	}

})

socket.on('disconnect', function() {

	if(CONFIG.ENV == 'dev') {
		console.log('Disconnected from server (shutdown sounds if any)')
	}

	stopAudio()
})

socket.on("boot", function(user) {
	if(CONFIG.ENV == 'dev') {
		console.log('Boot: ', user)
	}

	index = user.index
	total = user.index
	voice = user.voice
	active = false


	// clear default classes
	
	document.body.className = ''


	// load the sketch with data

	window.loadSketch(user)


	// update document style
	
	document.body.classList.add('is-voice-' + voice)


	// bind default click event to button

	// clear events (re-connections bind the same event twice!)
	document.getElementById('enter').removeEventListener('click', joinEvent)
	document.getElementById('enter').removeEventListener('click', resumeEvent)

	document.getElementById('enter').addEventListener('click', loadEvent)


	// bind default click to header

	document.getElementById('back').addEventListener('click', backEvent)


	// add orientation event for pausing/starting audio when already singing

	orientationEvents()

	
	// update label (default text)

	updateButtonLabel('loading')


	// Update the user interface

	updateCounterLabel()
})

/**
 * Update the index
 *
 */


socket.on("index", function(i) {
	index = i

	updateCounterLabel()
})


/**
 * Update the total
 *
 */


socket.on("total", function(i) {
	total = i

	updateCounterLabel()
})



function callbackFromSketch(){
	// update document style

	document.body.classList.add('is-ready')


	// bind new click event to button

	var enter = document.getElementById('enter')
	enter.removeEventListener('click', loadEvent)
	enter.addEventListener('click', joinEvent)


	// update the label

	updateButtonLabel('join the<br/>choir')									// button text when loading is complete


	// callback to server (retrieve current playheads (?))

	socket.emit('ready')
}

var loadEvent = function(e){
	e.preventDefault()

	if(CONFIG.ENV == 'dev'){
		console.log("Click on Loading")
	}
}

var joinEvent = function(e){
	startSketch(e, function(){
		if(CONFIG.ENV == 'dev'){
			console.log("Joined the choir")
		}

		// notify server
		
		socket.emit('joined')


		// bind new click event to button

		document.getElementById('enter').removeEventListener('click', joinEvent)
		document.getElementById('enter').addEventListener('click', resumeEvent)


		// update the label

		updateButtonLabel('resume')
	})
}

var resumeEvent = function(e){
	startSketch(e, function(){
		if(CONFIG.ENV == 'dev'){
			console.log("Resumed the choir")
		}

		// notify server

		socket.emit('resume')
	})
}

var backEvent = function(e){
	e.preventDefault()

	if(CONFIG.ENV == 'dev'){
		console.log("Left the choir")
	}


	// update document style

	document.body.classList.remove('is-soundbox')

	// set active to false for orientation event

	active = false										


	// notify server

	socket.emit("left")


	// Stop the audio from playing

	pauseAudio()
} 

function startSketch(e, fn){
	e.preventDefault()

	if(fn && typeof(fn) === "function") {
		fn()
	}

	// update document style

	document.body.classList.add('is-soundbox')

	// set active to true for orientation event

	active = true

	// the sketch is by default paused to prevent sound from home
	// and start the audio files from the beginning

	startAudio()

	// updateCounterLabel()	
}

function orientationEvents() {
	var screenOrientation = getOrientation()

	window.onresize = function(event) {
		 var _screenOrientation = getOrientation()

		 if(screenOrientation != _screenOrientation) {

		 	if(screenOrientation == 0) {														// landscape

		 		if(CONFIG.ENV == 'dev') {
		 			console.log("Orientation: landscape")
		 		}

		 		if(active) {
		 			pauseAudio()
		 		}

		 	}else if(screenOrientation == 90) {													// portrait
		 		if(CONFIG.ENV == 'dev') {
		 			console.log("Orientation: portrait")
		 		}

		 		if(active) {
		 			startAudio()
		 		}
		 	}
		 }

		 screenOrientation = _screenOrientation
	}

	function getOrientation() {
		return window.innerWidth > window.innerHeight? 90 : 0
	}
}

function updateButtonLabel(str) {
	document.getElementById('svg_label').innerHTML = str
}

function updateCounterLabel() {
	document.getElementById('index').innerHTML = index
	document.getElementById('total').innerHTML = total
}