const R = require('ramda');
const { Nothing } = require('@sniptt/monads');
const { influx } = require('./influx');
const movingAverageService = require('../utils/algo');

let fastMA = Nothing;
let slowMA = Nothing;

async function generateSignal(metric) {
	const data = influx.queryMetricData(metric);

	fastMA = movingAverageService.calculateMovingAverage(data.slice(-10));
	slowMA = movingAverageService.calculateMovingAverage(data.slice(-20));

	const [prevFastMA, prevSlowMA] = R.map(R.last, [fastMA, slowMA]);

	if (fastMA.isJust && slowMA.isJust) {
		if (fastMA.value > slowMA.value && prevFastMA < prevSlowMA) {
			console.log('Buy signal');
		} else if (fastMA.value < slowMA.value && prevFastMA > prevSlowMA) {
			console.log('Sell signal');
		}
	}
}

// setInterval(generateSignal, 60000);