import p5 from 'p5'
import 'p5/lib/addons/p5.sound'

var sketch = function(socket, callback){

	var MARGIN_WIDTH = 50
	var MAX_WIDTH = 500 + MARGIN_WIDTH
	var ASPECT_RATIO_HEIGHT = 1.11

	var COLORS = [
			[39, 129, 168],		// blue
			[58, 117, 91], 		// green
			[237, 217, 130],	// yellow
			[168, 39, 39]		// red
		]
	
	var circles = []
	var voice = 0

	window.preload = function() {
		soundFormats('ogg')
	}

	window.windowResized = function() {
		var dim = getCanvasDimensions()
	  	resizeCanvas(dim.w, dim.h)
	}

	window.setup = function () {
		var dim = getCanvasDimensions()
		createCanvas(dim.w, dim.h)

		textFont('Arial')
		textSize(30)

		circles.push( new Circle(200, 0.05) )
		circles.push( new Circle(200, 0.1) )
		circles.push( new Circle(250, 0.01) )
		circles.push( new Circle(150, 0.2) )	

		socket.on('init', function(i, v) {							// index, voice
			voice = v

			var _voice = 0											// for debugging

			circles.forEach(function(circle, i) {	
				var src = 'sound/' + _voice + '-' + i +'.ogg'

				loadSound(src, function(sound) {					// async
					circle.setSound(sound)

					if(allLoaded(circles)) {
						ready(circles)
					}
				})
			})

		})

		// reset default mouse positions

		mouseX = -1
		mouseY = -1
	}

	window.draw = function() {
		// Capture the position of the mouse (or touch)

		var x = mouseX
		var y = mouseY

		background(0)
		noCursor()

		circles.forEach(function(c) {
			c.update(x, y)
		})

		drawCircles(circles)

		drawText()

		if(onCanvas(x,y)) {
			drawSpider(circles, x, y)
			drawCenter(x, y)

			if(arePlayingSolo(circles)) {

				circles.forEach(function(c) {
					if(c.inside){
						c.setMute(false)
					} else {
						c.setMute(true)
					}
				})

			}else{
				muteCircles(false)
			}

		}else{
			muteCircles(true)
		}

	}

	function arePlayingSolo(circles) {
		var flag = false

		circles.forEach(function(c) {
			if(c.inside) {
				flag = true
			}
		})

		return flag
	}

	function muteCircles(b) {
		circles.forEach(function(c) {
			c.setMute(b)
		})
	}

	function drawText() {
		var padding = 10

		var top = 20 + padding/2
		var bottom = height - 1 - padding * 2
		
		var left = padding
		var right = width - padding

		fill(getColor())
		strokeWeight(0)

		textAlign(LEFT)
		text(1, left, top)
		text(3, left, bottom)

		textAlign(RIGHT)
		text(2, right, top)
		text(4, right, bottom)
	}

	function drawCircles(circles) {
		var steps = 10
		var stepX = width/steps
		var stepY = height/steps

		stroke(getColor())
		noFill()
		strokeWeight(1)

		rect(0, 0, width - 1, height - 2)
		
		circles[0].draw(stepX * 3, stepY * 2)
		circles[1].draw(stepX * 7, stepY * 3)
		circles[2].draw(stepX * 3, stepY * 6)
		circles[3].draw(stepX * 7, stepY * 7)
	}

	function drawCenter(x, y) {
		fill(255, 50)
		fill(getColor())
		noStroke()
		ellipse(x, y, 1, 1)
	}

	function drawSpider(circles, x, y) {
		stroke(255, 100)
		strokeWeight(1)

		circles.forEach(function(circle) {
			var rad = circle.getScaledRad()

			var center = createVector(circle.x, circle.y)									// center of circle
			var playhead = createVector(circle.x + circle.timeX, circle.y + circle.timeY)		// moving playhead point

			// mouse to playhead position on the circle
			var mouse = createVector(x, y)
			mouse.sub(playhead)

			// get distance from to center
			var d = dist(x, y, circle.x, circle.y)
			d = constrain(d, 0, rad)
			d = map(d, 0, rad, 10, 0)

			var vol = map(d, 10, 0, 1, 0)
			var opacity = map(vol, 0, 1, 100, 255)

			// get distance to outerCircle
			var dOuterCircle = dist(x, y, circle.x, circle.y)
			dOuterCircle -= rad

			var volOuterCircle = constrain(map(dOuterCircle, 0, 30, 1, 0), 0, 1)
			var opacityOuterCircle = map(volOuterCircle, 0, 1, 0, 255)

			// update sound

			var volume = volOuterCircle

			if(circle.inside){
				volume = 1
			}

			// set volume to circle
			circle.setVolume(volume)

			// display
			stroke(getColor(opacityOuterCircle))

			if(!arePlayingSolo(circles)){
				draw()
			}else{
				if(circle.inside){
					draw()
				}
			}

			function draw(){
				push()
				translate(playhead.x, playhead.y)
				line(0, 0, mouse.x, mouse.y)
				pop()
			}
		})
	}

	function onCanvas(x, y) {
		if(x >= 0 && x <= width && y >= 0 && y <= height) {
			return true
		}
		
		return false
	}

	function Circle(rad, acc) {	
		this.rad = rad
		this.acc = acc
		this.rot = 0

		this.x = 0
		this.y = 0

		this.timeX = 0
		this.timeY = 0

		this.sound = null
		this.volume = 0
		this.mute = false

		this.inside = false

		this.scaledRad = rad * scalePercent()
	  
		this.update = function(x, y) {
			this.rot += this.acc
			this.scaledRad = this.rad * scalePercent()

			// Inside circle?
			this.inside = this.isInside(x, y)

			// Muted?
			if(this.isLoaded()) {
				if(this.mute) {
					this.sound.setVolume(0)
				}else{
					this.sound.setVolume(this.volume)
				}
			}
		}

		this.setSound = function(sound) {
			this.sound = sound
			this.sound.play()
		}

		this.setMute = function(b) {
			this.mute = b
		}

		this.draw = function(x, y) {
			var rad = this.scaledRad

			this.x = x
			this.y = y

			this.timeX = - cos(this.rot) * rad / 2
			this.timeY = - sin(this.rot) * rad / 2

			noFill()

			if(this.inside) {
				fill(getColor())
				textAlign(CENTER, CENTER)
				strokeWeight(0)
				text("solo", x, y)
				noFill()
			}

			// Draw it

			stroke(getColor())
			strokeWeight(1)

			push()
			translate(x, y)
			ellipse(0, 0, rad, rad)
			line(0, 0, this.timeX, this.timeY)
			pop()
		}

		this.isInside = function(x, y) {
			if(dist(this.x, this.y, x, y) < this.getScaledRad()/2) {
				return true
			}

			return false
		}

		this.isLoaded = function() {
			if(this.sound != null && this.sound.isLoaded()) {
				return true
			}

			return false
		}

		this.loop = function() {
			this.sound.loop()
		}

		this.setVolume = function(f) {
			this.volume = f
		}

		this.getVolume = function() {
			return this.volume
		}

		this.getScaledRad = function() {
			return this.scaledRad
		}
	}

	function getCanvasDimensions() {
		var w = constrain(windowWidth, 0, MAX_WIDTH)
		w -= MARGIN_WIDTH									// Having a margin around the canvas

		var h = w * ASPECT_RATIO_HEIGHT

		return {
			w,
			h
		}
	}

	function scalePercent() {
		return (width / MAX_WIDTH)
	}

	function allLoaded(circles) {
		var flag = true

		circles.forEach(function(c) {
			if(!c.isLoaded()) {
				flag = false
			}
		})

		return flag
	}

	function play(circles) {
		circles.forEach(function(c) {
			c.loop()
		})
	}

	function getColor(opacity = 255) {
		var clr = COLORS[voice]
		return color(clr[0], clr[1], clr[2], opacity)
	}

	function ready(circles) {
		// callback to server (retrieve current playheads (?))
		socket.emit('callback')

		// play all circles (future: with current playheads?)
		play(circles)

		// callback to index.js (fade-in with CSS class)
		callback()
	}
}

export default sketch