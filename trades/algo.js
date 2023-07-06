const patternDetectionFunctions = {};

// Require all pattern detection functions from the patterns directory
const patternFiles = require('fs').readdirSync('./patterns');
patternFiles.forEach((patternFile) => {
	if (patternFile.endsWith('.js')) { const patternName = patternFile.slice(0, -3);
		patternDetectionFunctions[patternName] = require(`./patterns/${patternFile}`);
	}
});

/**
 * Calculates the Simple Moving Average (SMA) of an array of numbers over a given period.
 *
 * @param {number[]} data - The array of data points.
 * @param {number} period - The period for the moving average.
 * @returns {number|undefined} - The simple moving average, or undefined if there's not enough data.
 */
function calculateSMA(data, period) {
	if (!Array.isArray(data) || !Number.isInteger(period) || period <= 0) {
		throw new Error('Invalid parameters. Expecting an array of numbers (data) and a positive integer (period).');
	}

	if (data.length < period) {
		return undefined;
	}

	let sum = 0;
	for (let i = 0; i < period; i++) {
		sum += data[i];
	}

	return sum / period;
}

/**
 * Calculates the exponential moving average (EMA) of an array of numbers over a given period.
 *
 * @param {number[]} data - The array of data points.
 * @param {number} period - The period for the exponential moving average.
 * @returns {number|null} The exponential moving average or null if there's not enough data.
 */
function calculateEMA(data, period) {
	if (data.length < period) {
		return null;
	}

	const alpha = 2 / (period + 1);
	const initialSMA = data.slice(0, period).reduce((sum, val) => sum + val, 0) / period;

	return data.reduce((ema, value, index) => {
		if (index < period - 1) {
			return ema;
		}
		return (value * alpha) + (ema * (1 - alpha));
	}, initialSMA);
}

/**
 * Calculates the mean (average) of an array of numbers.
 *
 * @param {number[]} data - The array of data points.
 * @returns {number|null} The mean or null if there's not enough data.
 */
function calculateMean(data) {
	if (data.length === 0) {
		return null;
	}

	const sum = data.reduce((acc, val) => acc + val, 0);
	return sum / data.length;
}

/**
 * Calculates the Volume Weighted Average Price (VWAP) of a series of prices with corresponding volumes.
 * @param {number[]} prices - The array of prices.
 * @param {number[]} volumes - The array of corresponding volumes.
 * @returns {number} The calculated VWAP.
 * // Example usage
 * const prices = [10, 12, 11, 13];
 * const volumes = [500, 600, 400, 700];
 * const vwap = calculateVWAP(prices, volumes);
 * console.log(vwap);
 */
const calculateVWAP = (prices, volumes) => {
	if (!Array.isArray(prices) || !Array.isArray(volumes) || prices.length !== volumes.length || prices.length === 0) {
		throw new Error('Invalid parameters. Expecting two non-empty arrays of equal length.');
	}

	const totalPriceVolumeSum = prices.reduce((sum, price, index) => sum + price * volumes[index], 0);
	const totalVolume = volumes.reduce((sum, volume) => sum + volume, 0);

	if (totalVolume === 0) {
		throw new Error('Total volume cannot be zero.');
	}

	return totalPriceVolumeSum / totalVolume;
};

/**
 * Calculates the Stochastic Oscillator of a series of prices over a specified period with the given %K and %D periods.
 * @param {number[]} prices - The array of prices.
 * @param {number} period - The period for the Stochastic Oscillator calculation.
 * @param {number} kPeriod - The %K period.
 * @param {number} dPeriod - The %D period.
 * @returns {object} An object containing the Stochastic Oscillator values (%K, %D).
 *
 * // Example usage
 * const prices = [
 * 	{ timestamp: 1, low: 10, high: 15, close: 12 },
 * 	{ timestamp: 2, low: 11, high: 16, close: 14 },
 *	{ timestamp: 3, low: 9, high: 17, close: 13 },
 *	{ timestamp: 4, low: 12, high: 18, close: 16 },
 *	// Add more price data as per your dataset
 * ];
 * const period = 4;
 * const kPeriod = 3;
 * const dPeriod = 3;
 * const stochasticOscillator = calculateStochasticOscillator(prices, period, kPeriod, dPeriod);
 * console.log(stochasticOscillator);
 */
const calculateStochasticOscillator = (prices, period, kPeriod, dPeriod) => {
	if (!Array.isArray(prices) || prices.length < period || kPeriod < 1 || dPeriod < 1) {
		throw new Error('Invalid parameters');
	}

	const getMin = arr => Math.min(...arr);
	const getMax = arr => Math.max(...arr);

	const calculateK = (currentClose, lows, highs) => {
		const lowestLow = getMin(lows);
		const highestHigh = getMax(highs);
		return ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;
	};

	const calculateD = kValues => {
		return kValues.reduce((sum, k) => sum + k, 0) / kValues.length;
	};

	const kValues = prices.map((price, index) => {
		if (index >= period - 1) {
			const currentPrices = prices.slice(index - period + 1, index + 1);
			const lows = currentPrices.map(price => price. low);
			const highs = currentPrices.map(price => price.high);
			const currentClose = price.close;
			return calculateK(currentClose, lows, highs);
		}
		return null;
	});

	const dValues = kValues
		.slice(period - kPeriod)
		.map((_, index) => calculateD(kValues.slice(index, index + kPeriod)));

	return { k: kValues.slice(period - kPeriod), d: dValues.slice(dPeriod - 1) };
};

/**
 * Identifies the support levels in a series of prices.
 * @param {number[]} prices - The array of prices.
 * @returns {number[]} An array of identified support levels.
 * // Example usage
 * const prices = [10, 8, 12, 9, 6, 13];
 * const supportLevels = calculateSupportLevels(prices);
 * console.log(supportLevels);
 */
const calculateSupportLevels = (prices) => {
	if (!Array.isArray(prices) || prices.length < 3) {
		throw new Error('Invalid prices data.');
	}

	const identifySupportLevels = (prevPrice, price, nextPrice) => {
		if (price < prevPrice && price < nextPrice) {
			return price;
		}
		return null;
	};

	const supportLevels = prices.map((price, index) => {
		if (index === 0 || index === prices.length - 1) {
			return null;
		}
		return identifySupportLevels(prices[index - 1], price, prices[index + 1]);
	});

	return supportLevels.filter((level) => level !== null);
};


/**
 * Checks if the lower shadow of the candle is significantly longer than the body.
 * @param {Candle} candle - The candle to check.
 * @returns {boolean} True if the lower shadow is significantly longer, false otherwise.
 */
const isLowerShadowSignificantlyLonger = (candle) => {
	const lowerShadowLength = candle.low - Math.min(candle.open, candle.close);
	const bodyLength = Math.abs(candle.open - candle.close);

	return lowerShadowLength > 2 * bodyLength;
};

/**
 * Checks if the upper shadow of the candle is absent.
 * @param {Candle} candle - The candle to check.
 * @returns {boolean} True if the upper shadow is absent, false otherwise.
 */
const isUpperShadowAbsent = (candle) => {
	return candle.high === Math.max(candle.open, candle.close);
};

/**
 * Checks if the body of the candle is short.
 * @param {Candle} candle - The candle to check.
 * @returns {boolean} True if the body is short, false otherwise.
 */
const isBodyShort = (candle) => {
	const bodyLength = Math.abs(candle.open - candle.close);
	const averageTrueRange = candle.high - candle.low;

	return bodyLength < 0.25 * averageTrueRange;
};

/**
 * Checks if the body of the candle is in the upper half of the high-low range.
 * @param {Candle} candle - The candle to check.
 * @returns {boolean} True if the body is in the upper half, false otherwise.
 */
const isBodyInTheUpperHalf = (candle) => {
	const bodyTop = Math.max(candle.open, candle.close);
	const bodyBottom = Math.min(candle.open, candle.close);
	const highLowRange = candle.high - candle.low;

	return bodyBottom > candle.low + 0.5 * highLowRange;
};

/**
 * Checks if the upper shadow of the candle is small.
 * @param {Candle} candle - The candle to check.
 * @returns {boolean} True if the upper shadow is small, false otherwise.
 */
const isUpperShadowSmall = (candle) => {
	const upperShadowLength = Math.max(candle.open, candle.close) - candle.high;
	const bodyLength = Math.abs(candle.open - candle.close);

	return upperShadowLength < bodyLength;
};

/**
 * Checks if the upper shadow of the candle is significantly longer than the body.
 * @param {Candle} candle - The candle to check.
 * @returns {boolean} True if the upper shadow is significantly longer, false otherwise.
 */
const isUpperShadowSignificantlyLonger = (candle) => {
	const upperShadowLength = Math.max(candle.open, candle.close) - candle.high;
	const bodyLength = Math.abs(candle.open - candle.close);

	return upperShadowLength > 2 * bodyLength;
};

/**
 * Checks if the lower shadow of the candle is small.
 * @param {Candle} candle - The candle to check.
 * @returns {boolean} True if the lower shadow is small, false otherwise.
 */
const isLowerShadowSmall = (candle) => {
	const lowerShadowLength = candle.low - Math.min(candle.open, candle.close);
	const bodyLength = Math.abs(candle.open - candle.close);

	return lowerShadowLength < bodyLength;
};

/**
 * Checks if the body of the candle is in the lower half of the high-low range.
 * @param {Candle} candle - The candle to check.
 * @returns {boolean} True if the body is in the lower half, false otherwise.
 */
const isBodyInTheLowerHalf = (candle) => {
	const bodyTop = Math.max(candle.open, candle.close);
	const bodyBottom = Math.min(candle.open, candle.close);
	const highLowRange = candle.high - candle.low;

	return bodyTop < candle.high - 0.5 * highLowRange;
};

/**
 * Checks if the previous candle indicates a downtrend.
 * @param {Candle} previousCandle - The previous candle.
 * @param {Candle} currentCandle - The current candle.
 * @returns {boolean} True if the previous candle indicates a downtrend, false otherwise.
 */
const isDowntrend = (previousCandle, currentCandle) => {
	return previousCandle.close > previousCandle.open &&
		currentCandle.close < currentCandle.open;
};

/**
 * Checks if the current candle is a Doji Star.
 * @param {Candle} currentCandle - The current candle.
 * @returns {boolean} True if the current candle is a Doji Star, false otherwise.
 */
const isDojiStar = (currentCandle) => {
	const bodyLength = Math.abs(currentCandle.open - currentCandle.close);
	const totalLength = currentCandle.high - currentCandle.low;
	const shadowLengthThreshold = 0.1 * totalLength;

	return bodyLength < shadowLengthThreshold;
};

/**
 * Checks if the current and next candles indicate an uptrend.
 * @param {Candle} currentCandle - The current candle.
 * @param {Candle} nextCandle - The next candle.
 * @returns {boolean} True if the current and next candles indicate an uptrend, false otherwise.
 */
const isUptrend = (currentCandle, nextCandle) => {
	return currentCandle.close < currentCandle.open &&
		nextCandle.close > nextCandle.open;
};

/**
 * Identifies the resistance levels in a series of prices.
 * @param {number[]} prices - The array of prices.
 * @returns {number[]} An array of identified resistance levels.
 */
const calculateResistanceLevels = (prices) => {
	const resistanceLevels = [];

	for (let i = 1; i < prices.length - 1; i++) {
		const currentPrice = prices[i];
		const prevPrice = prices[i - 1];
		const nextPrice = prices[i + 1];

		if (currentPrice > prevPrice && currentPrice > nextPrice) {
			resistanceLevels.push(currentPrice);
		}
	}

	return resistanceLevels;
};

/**
 * Calculates the average gain and average loss of an array of numbers.
 *
 * @param {number[]} data - The array of data points.
 * @returns {object} An object with the average gain and average loss.
 */
function calculateAverageGainLoss(data) {
	let sumGain = 0;
	let sumLoss = 0;

	for (let i = 1; i < data.length; i++) {
		const diff = data[i] - data[i - 1];

		if (diff > 0) {
			sumGain += diff;
		} else if (diff < 0) {
			sumLoss -= diff;
		}
	}

	const averageGain = sumGain / data.length;
	const averageLoss = sumLoss / data.length;

	return { averageGain, averageLoss };
}


/**
 * Detects common candlestick patterns in a series of candlestick data.
 * @param {Candle[]} candles - The array of candlestick data.
 * @returns {string[]} An array of detected candlestick patterns.
 */
const detectCandlestickPatterns = (candles) => {
	const detectedPatterns = [];

	Object.entries(patternDetectionFunctions).forEach(([patternName, detectFunction]) => {
		if (detectFunction(candles)) {
			detectedPatterns.push(patternName);
		}
	});

	return detectedPatterns;
};

module.exports = {
    calculateSupportLevels,
    calculateStochasticOscillator,
    calculateResistanceLevels,
    calculateAverageGainLoss,
    calculateSMA,
    calculateEMA,
    calculateVWAP,
    calculateMean,
    isDowntrend,
    isDojiStar,
    isUptrend,
    isBodyShort,
    isBodyInTheUpperHalf,
    isBodyInTheLowerHalf,
    isUpperShadowAbsent,
    isUpperShadowSmall,
    isUpperShadowSignificantlyLonger,
		isLowerShadowSmall,
    isLowerShadowSignificantlyLonger,
}
