import './main.scss';
import sketch from './sketch'
import io from 'socket.io-client'

var socket = io()

var index = 0,
	total = 0,
	voice = 0

// Self

socket.on("index", function(i) {
	index = i
	total = i

	update()
});

socket.on("voice", function(i) {
	voice = i

	var clss = 'is-voice-' + i
	document.body.classList.add(clss)
});

// Other

socket.on("disconnection", function(data) {
	if(index >= data.user.index) {
		index--
	}

	total = data.total_connections

	update()
});

socket.on("total", function(i) {
	total = i

	update()
});

function update() {
	document.getElementById('index').innerHTML = index
	document.getElementById('total').innerHTML = total
}

sketch(socket)