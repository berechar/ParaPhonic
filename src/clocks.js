const cs = require('color-stepper')

var intervals = []
var timeouts = []

module.exports = {

	buildInterval: function(fn, ms){
		return setInterval(function(){
			fn()
		}, ms)
	},

	buildTimeoutToClearInterval: function(interval, ms){
		return setTimeout(function(){
			clearInterval(interval)
		}, ms)	
	},

	buildTimeout: function(fn, ms){
		return setTimeout(function(){
			fn()
		}, ms)
	},

	buildColorSwitchInterval: function(ms = 500, length = 4){
		var id = 0

		return setInterval(function(){
			if(id < length - 1){
				id++
			}else{
				id = 0
			}

			console.log(id)
		}, ms)
	},

	buildColorWheelInterval: function(colors, steps, ms, fn){
		const colorSteps = cs.generateSteps(colors, steps)
		var index = 0

		return setInterval(function(){
			var color = colorSteps[index]

			if(index < colorSteps.length - 1){
				index++
			}else{
				index = 0
			}

			color = color.substr(1).toUpperCase()

			fn(color)	
		}, ms)
	},

	addInterval: function(interval){
		intervals.push(interval)
	},

	addTimeout: function(timeout){
		timeouts.push(timeout)
	},

	clearIntervals: function(){
		intervals.forEach(function(interval){
			clearInterval(interval)
		})
	},

	clearTimeouts: function(){
		timeouts.forEach(function(timeout){
			clearTimeout(timeout)
		})
	}
}