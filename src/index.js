import './main.scss'
import { sketch, startAudio, stopAudio } from './sketch'
import io from 'socket.io-client'

var socket = io()

var index = 0,
	total = 0,
	voice = 0

socket.on("init", function(i, v) {

	// clear default classes
	document.body.className = ''

	index = i
	total = i

	voice = v

	updateVoiceUI(v)

	updateUI()
	
})

socket.on("total", function(i) {
	total = i

	updateUI()
})

socket.on("disconnection", function(data) {
	if(index >= data.user.index) {
		index--
	}

	total = data.total_connections

	updateUI()
})

var enter = document.getElementById('enter')

enter.addEventListener('click', function(e){
	e.preventDefault()

	//document.getElementById('home').classList.add('is-hidden')
	document.body.classList.add('is-soundbox')


	// the sketch is by default paused to prevent sound from home
	// and start the audio files from the beginning

	startAudio()

	return false
})

var returnHome = document.getElementById('return')

returnHome.addEventListener('click', function(e){
	e.preventDefault()

	document.body.classList.remove('is-soundbox')

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