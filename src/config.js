module.exports = {
	ENV: 						'production',					// 'dev' or 'production'
	WEMOS_ADDRESS: 				'http://192.168.42.101',		// WeMos ip address for sending GET requests to control electronics
	DEBUG: 						false,
	SKIP_PANDA: 				true,							// while doing production but not wanting to deal with pyropanda
	INFINITE_MOTORS: 			true,							// if [true], boot system with infinite rotating motors

	PING_INTERVAL: 				5000,							// time (ms) for doing an interval request to Pyropanda
	PING_TIMEOUT: 				5000,							// time (ms) for timeout before sending the default settings to PyroPanda after a successfull ping

	COLOR_WHEEL: 				true,    						// if [true], roll through all singing voices after someone joins the choir
	COLOR_WHEEL_INTERVAL: 		16000,							// time (ms) for color wheel interval
	COLOR_WHEEL_NEW_TIMEOUT: 	1000,							// time (ms) for timeout before starting the interval

	DEFAULT_LED_COLOR: 			'111111',						// default LED color

	LED_COLORS: [
								'0D1D16',						// blue
								'11250D',						// green
								'312906',						// yellow
								'200704'						// red
	],

	COLORS: [
								[39, 129, 168],					// blue
								[58, 117, 91], 					// green
								[237, 217, 130],				// yellow
								[168, 39, 39]					// red
	],

	MAX_VOICES: 				4
}