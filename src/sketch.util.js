import p5 from 'p5'

const CONFIG = require('./config.js')

export function onCanvas(x, y) {
	if(x >= 0 && x <= width && y >= 0 && y <= height) {
		return true
	}
	
	return false
}

export function scalePercent() {
	return (width / CONFIG.SKETCH.MAX_WIDTH)
}

export function getCanvasDimensions() {
	var w = constrain(windowWidth, 0, CONFIG.SKETCH.MAX_WIDTH)
	w -= CONFIG.SKETCH.MARGIN															// Having a margin around the canvas

	var h = w * CONFIG.SKETCH.ASPECT_RATIO_HEIGHT

	return {
		w,
		h
	}
}