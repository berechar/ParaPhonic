import './main.scss'
import { sketch, startAudio, stopAudio } from './sketch'
import io from 'socket.io-client'

var CONFIG = require('./config.js')

var socket = io()

var index = 0,
	total = 0,
	voice = 0


/**
 * Initalize page on first request and also on refresh
 *
 */


sketch(socket, callbackFromSketch)

socket.on("boot", function(user) {
	
	console.log('boot: ', user)

	index = user.index
	total = user.index
	voice = user.voice


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

	
	// update label (default text)

	updateButtonLabel('loading')


	// Update the user interface

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


function updateUI() {
	document.getElementById('index').innerHTML = index
	document.getElementById('total').innerHTML = total
}

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
	console.log("Click on Loading")
}

var joinEvent = function(e){
	startSketch(e, function(){
		console.log("Joined the choir")


		// update document style

		document.body.classList.add('is-soundbox')


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
		console.log("Resumed the choir")

		// update document style

		document.body.classList.add('is-soundbox')

		// notify server

		socket.emit('resume')
	})
}

var backEvent = function(e){
	e.preventDefault()

	console.log("Left the choir")


	// update document style

	document.body.classList.remove('is-soundbox')


	// notify server

	socket.emit("left")


	// Stop the audio from playing

	stopAudio()
} 

function startSketch(e, fn){
	e.preventDefault()

	if(fn && typeof(fn) === "function") {
		fn()
	}

	// the sketch is by default paused to prevent sound from home
	// and start the audio files from the beginning

	startAudio()

	updateUI()	
}

function updateButtonLabel(str){
	document.getElementById('svg_label').innerHTML = str
}