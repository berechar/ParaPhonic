module.exports = {
	ENV: 						'production',					// 'dev' or 'production'
	WEMOS_ADDRESS: 				'http://192.168.42.101',		// WeMos ip address for sending GET requests to control electronics
	DEBUG: 						true,
	SKIP_PANDA: 				false,							// while doing production but not wanting to deal with pyropanda
	INFINITE_MOTORS: 			false,							// if [true], boot system with infinite rotating motors
	MOTORS: 					true,							// if [true], motors will be active when users are connected

	PING_INTERVAL: 				5000,							// time (ms) for doing an interval request to Pyropanda
	PING_TIMEOUT: 				5000,							// time (ms) for timeout before sending the default settings to PyroPanda after a successfull ping

	COLOR_WHEEL: 				true,    						// if [true], roll through all singing voices after someone joins the choir
	COLOR_WHEEL_INTERVAL: 		16000,							// time (ms) for color wheel interval
	COLOR_WHEEL_NEW_TIMEOUT: 	1000,							// time (ms) for timeout before starting the interval

	DEFAULT_LED_COLOR: 			'111111',						// default LED color

	LED_COLORS: [												// LED
								'0D1D16',						// blue
								'11250D',						// green
								'312906',						// yellow
								'200704'						// red
	],

	MAX_VOICES: 				4,								// maximum amount of voices for the choir

	SKETCH: {
		ASPECT_RATIO_HEIGHT: 	1.11,							// the width of the canvas determines the height
		MARGIN: 				50,								// equals: left and right || top and bottom
		MAX_WIDTH: 				550,							// equals WIDTH (500) and MARGIN (50)
		COLORS: [
								[39, 129, 168],					// blue
								[58, 117, 91], 					// green
								[237, 217, 130],				// yellow
								[168, 39, 39]					// red
		]
	}
}