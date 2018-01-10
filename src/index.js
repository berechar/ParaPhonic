import './main.scss'
import sketch from './sketch'
import io from 'socket.io-client'

var socket = io()

var index = 0,
	total = 0,
	voice = 0

socket.on("init", function(i, v) {

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