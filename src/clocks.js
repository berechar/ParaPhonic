var intervals = []

module.exports = {

	buildInterval: function(fn, ms){
		return setInterval(function(){
			fn()
		}, ms)
	},
	
	buildColorInterval: function(colors, ms, fn){
		var index = 0

		return setInterval(function(){
			var color = colors[index]

			if(index < colors.length - 1){
				index++
			}else{
				index = 0
			}

			color = color.toUpperCase()

			fn(color)	
		}, ms)
	},

	addInterval: function(interval){
		intervals.push(interval)
	},


	clearIntervals: function(){
		intervals.forEach(function(interval){
			clearInterval(interval)
		})
	},
}