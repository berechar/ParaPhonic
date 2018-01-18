/**
 * Ticker
 *
 */

module.exports = {	
 	counter: 0,
 	interval: null,
 	play: true,
 	max_time: 1000 * 70,
 	init: function() {
 		this.counter = 0

 		// the interval ticks every second

 		this.interval = setInterval(() => {
 			if(!this.play) return false

 			this.counter++
 			
 			//console.log(this.counter)

	 		if(this.counter % 8 == 0){
		 		//console.log("[8]")
		 		this.callback(this.counter, 8)
		 		return false
		 	}

		 	if(this.counter % 4 == 0){
		 		//console.log("[4]")
		 		this.callback(this.counter, 4)
		 		return false
		 	}

		 	if(this.counter % 2 == 0){
		 		//console.log("[2]")
		 		this.callback(this.counter, 2)
		 		return false
		 	}

		 	this.callback(this.counter, 1)

		 	//console.log('[1]')
		 }, 1000)
 	},

 	callback: function(){},
 	
 	metro: function(fn){
 		this.callback = fn
 	},

 	reset: function(){
 		console.log('reset ticker')
 		this.counter = 0
 	},

 	pause: function(){
 		console.log('paused ticker')
 		this.play = false
 	},

 	resume: function(){
 		console.log('resumed ticker')
 		this.play = true
 	}
}

function isFn(fn){
	if (fn && typeof(fn) === "function") {
		return true
	}

	return false
}