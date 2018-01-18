const CONFIG = require('./config.js')

/**
 * Utilities
 *
 */

 module.exports = {
 	getVoice: function(arr){
		// return the least chosen voice(s)

		// get the lowest value of all voices
		var min = arr.reduce( (a,b,i) => a[0] > b ? [b,i] : a, [Number.MAX_VALUE,-1])[0]

		// get set of indexes whose value is the lowest
		var lowest = []

		// find out which voices all share the lowest amount of use
		for(i = 0; i < arr.length; i++){
			if(arr[i] == min){
				lowest.push(i)
			}
		}

		// get a random index from this set
		var index = Math.floor(Math.random() * lowest.length)

		// find the corresponding voice and return it
		var voice = lowest[index]

		return voice
 	},

 	getColor: function(index){
 		if(index >= 0 || index < CONFIG.LED_COLORS.length){
 			return CONFIG.LED_COLORS[index]
 		}

 		console.log('getColor() index out of bounds >>> returning default LED color')

 		return CONFIG.DEFAULT_LED_COLOR
 	},

 	getObjAsArray: function(obj){
 		return Array.from(Object.keys(obj), k=>obj[k]);
 	}
 }