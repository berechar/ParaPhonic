const CONFIG = require('./config.js')
var request = require("request")			// request for AJAX POST request to pyropanda

module.exports = {
	init: function(){
		console.log("init")
	},
	send: function(urlSegment = '/', data = {}, callback){
		if(CONFIG.DEV == 'dev'){
			return false	
		}
		
		var url = 'http://192.168.42.101' + urlSegment

		request({
			url: url,
			method: "GET",
			qs: data
		}, function( error, resp, body){

			if(callback != null){
				callback(body)
			}
			
		})
	},
	testLED: function(){
		this.send('/light/test')
	},
	toMotor: function(id, time = 1500){
		if(id == null || id == undefined){
			return false
		}

		if(id < 0 || id > 2){
			return false
		}

		this.send('/spin', {		
			'id': id,
			'time': time
		})
	},
	ping: function(callback){
		this.send('/light/solid', {
			'solid': '000000'
		}, callback)
	},
	solid: function(color = 'FF0000'){
		this.send('/light/solid', {
			'solid' : color
		})
	},
	clear: function(){
		this.solid('000000')
	},
	motor1: function(time){
		this.toMotor(1, time)
	},
	motor2: function(time){
		this.toMotor(2, time)
	}
}