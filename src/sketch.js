import p5 from 'p5'
import 'p5/lib/addons/p5.sound'

const CONFIG = require('./config.js')

var MARGIN_WIDTH = 50
var MAX_WIDTH = 500 + MARGIN_WIDTH
var ASPECT_RATIO_HEIGHT = 1.11
	
var voice = 0
var pause = true

var circles = []

var myFont = 'Helvetica'
var fontSize = 36

var sketch = function(socket, callback){
	window.preload = function() {
		soundFormats('mp3')
	}

	window.windowResized = function() {
		var dim = getCanvasDimensions()
	  	resizeCanvas(dim.w, dim.h)
	}

	window.setup = function() {
		var dim = getCanvasDimensions()
		createCanvas(dim.w, dim.h)


		//

		/*
		socket.on("bang", function(v){
			//console.log('- bang received', v)

			// pick a circle
			var index = int(random(circles.length))
			var circle = circles[index]

			// and tell it to sing a fragment on the next roundabout
			circle.doFragment()
		})
		*/

		// reset default mouse positions

		mouseX = -1
		mouseY = -1
	}


	/**
	 * This function is always called whenever the connection is (re)-connected
	 *
	 * This is true for the following tested browsers: Firefox, Chrome, Safari
	 *
	 */

	window.loadSketch = function(user){
  		myFont = loadFont('/font/naturamedium-regular-webfont.ttf')

  		textFont(myFont);
		textSize(fontSize)

		voice = user.voice

		circles = []													// reset the circles

		circles.push( new Circle(1, 200, 0.05) )						// 1
		circles.push( new Circle(2, 200, 0.1) )							// 2
		circles.push( new Circle(3, 250, 0.005) )						// 3
		circles.push( new Circle(4, 150, 0.2) )							// 4

		circles.forEach(function(circle, i) {
			var src = '/sound/' + voice + '-' + i +'.mp3'
			var cueSrc = '/cues/' + voice + '-' + i +'.txt'

			/*
			loadSound(src, function(sound) {					// async

				if(CONFIG.DEBUG) {
					console.log("Sound loaded: " + src)
				}

				circle.setSound(sound)

				loadStrings(cueSrc, function(data){
					
					if(CONFIG.DEBUG) {
						console.log("Cue loaded: " + cueSrc)
					}

					circle.setCues(data)

					if(allLoaded(circles)) {
						if(CONFIG.DEBUG) {
							console.log("All loaded")
						}

						// when ALL is loaded, make the front-end button active!

						callback()
					}
				})
			}, function(){
				console.log('error while loading: ' + src )
			})
			*/


			loadCircle(src, cueSrc)

			function loadCircle(src, cueSrc){
				loadSound(src, function(sound) {					// async

					if(CONFIG.DEBUG) {
						console.log("Sound loaded: " + src)
					}

					circle.setSound(sound)

					loadStrings(cueSrc, function(data){
						
						if(CONFIG.DEBUG) {
							console.log("Cue loaded: " + cueSrc)
						}

						circle.setCues(data)

						if(allLoaded(circles)) {
							if(CONFIG.DEBUG) {
								console.log("All loaded")
							}

							// when ALL is loaded, make the front-end button active!

							callback()
						}
					})
				}, function(){
					
					if(CONFIG.DEBUG) {
						console.log('error while loading: ' + src )
						console.log('reloading ' + src)
					}

					loadCircle(src, cueSrc)
				})
			}



			/*
			circle.setFragments(4)

			for(var i = 0; i < 4; i++){
				var index = i + 1
				var fragmentSrc = '/sound/extra' + index +'.mp3'
				let _i = i

				loadSound(fragmentSrc, function(sound){
					circle.addFragment(sound, _i)
				})
			}
			*/


		})	
	}

	window.draw = function() {
		// Capture the position of the mouse (or touch)

		var x = mouseX
		var y = mouseY

		background(0)
		noCursor()

		if(!pause) {
			circles.forEach(function(c) {
				c.update(x, y)
			})
		}

		drawCircles(circles)

		drawText()

		if(pause) {
			muteCircles(true)	
			return false
		}

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

		var top = 30 + padding/2
		var bottom = height + 10 - padding * 2
		
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
		
		if(circles.length > 0){
			circles[0].draw(stepX * 3, stepY * 2)
			circles[1].draw(stepX * 7, stepY * 3)
			circles[2].draw(stepX * 3, stepY * 6)
			circles[3].draw(stepX * 7, stepY * 7)
		}
	}

	function drawCenter(x, y) {
		fill(255, 50)
		fill(getColor())
		noStroke()
		ellipse(x, y, 5, 5)
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
				if(circle.silence){
					stroke(getColorDimmed(opacityOuterCircle))
					return false
				}

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

	function Circle(id, rad, acc) {	
		this.id = id
		this.rad = rad
		this.acc = acc

		this.rot = 0

		this.x = 0
		this.y = 0

		this.timeX = 0
		this.timeY = 0

		this.sound = null
		
		this.volume = 0
		this.mute = true
		this.silence = true

		this.fragments = []
		this.fragment = null
		this.playFragment = false

		this.inside = false

		this.scaledRad = rad * scalePercent()

		this.cuesLoaded = false
	  
		this.update = function(x, y) {
			this.rot += this.acc
			this.scaledRad = this.rad * scalePercent()

			// Inside circle?
			this.inside = this.isInside(x, y)

			// Muted?
			if(this.isLoaded()) {
				if(this.mute) {
					this.sound.setVolume(0)

					if(this.isSoundLoaded(this.fragment)){
						this.fragment.setVolume(0)
					}
				}else{
					this.sound.setVolume(this.volume)

					if(this.isSoundLoaded(this.fragment)){
						this.fragment.setVolume(this.volume)
					}
				}
			}
		}

		this.setSound = function(_sound) {			
			this.sound = _sound

			/*
			 * IMPORTANT
			 *
			 *  this function is also called when you start from the beginning!
			 *
			 *
			 */
			
			this.sound.onended(() => {
				if(pause){
					return false
				}

				//console.log('Circle #' + this.id + ' ended')

				// play a fragment if is being set by the master node clock

				/*
				if(_this.fragments.length > 0 && _this.playFragment) {

					var fragmentIndex = int(random(_this.fragments.length))
					var fragment = _this.fragments[ fragmentIndex ]

					_this.fragment = fragment

					if(this.mute) {
						fragment.setVolume(0)
					}else{
						fragment.setVolume(this.volume)
					}

					_this.playFragment = false

					fragment.play()
				}
				*/

				this.play()
				//console.log('Circle #' + this.id + ' looped')
			})
			

		}

		this.setCues = function(data){
			// this function presumes that the sound is already loaded
			var _this = this
	
			data.forEach(function(line){
				var parts = split(line, '\t')
				var time = parseFloat(parts[0])
				var val = parts[1]
				
				_this.sound.addCue(time, _this.fadeStroke, {
					_this: _this,
					val: val
				})
			})

			this.cuesLoaded = true
		}

		this.fadeStroke = function(data){
			var _this = data._this
			var type = data.val

			if(type == 'in'){
				_this.silence = false
			}else if(type == 'out'){
				_this.silence = true
			}
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

			
			// Draw it
			noFill()
			stroke(getColor())
			strokeWeight(1)

			if(this.silence){
				stroke(getColorDimmed())
			}

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
			if(this.isSoundLoaded(this.sound) && this.cuesLoaded){
				return true
			}

			return false
		}

		this.isSoundLoaded = function(s){
			if(s != null && s.isLoaded()) {
				return true
			}

			return false
		}

		this.setFragments = function(len){
			this.fragments = [len]
		}

		this.addFragment = function(sound, i){
			this.fragments[i] = sound
		}

		this.play = function(){
			//this.sound.loop()
			this.sound.play()
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

		this.doFragment = function(){
			this.playFragment = true
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
			c.play()
		})
	}

	function getColor(opacity = 255) {
		var clr = CONFIG.COLORS[voice]
		return color(clr[0], clr[1], clr[2], opacity)
	}

	function getColorDimmed(initialValue){
		if(initialValue < 125){
			return getColor(initialValue)	
		}

		return getColor(125)
	}
}

var startAudio = function(){
	circles.forEach(function(c) {
		//c.sound.jump()												// jump to the beginning of each soundfile
		c.sound.play()													// resume playing from where they are
	})

	pause = false
}

var pauseAudio = function(){
	pause = true

	circles.forEach(function(c) {
		c.sound.pause()													// resume playing from where they are
	})
}

var stopAudio = function(){
	pause = true														// needed to prevent the loop from kicking in

	circles.forEach(function(c) {
		c.sound.pause()													// Safari throws an error when calling stop() ...
	})
}

export { sketch, startAudio, stopAudio, pauseAudio }