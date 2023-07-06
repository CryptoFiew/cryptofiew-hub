const readline = require('readline');
const talib = require('ta-lib');
const {calculateBollingerBands} = require("../algo");

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});

// Function to calculate the dynamic DCA strategy
function calculateDynamicDCA(klineData, initialInvestment, maxInvestmentPercentage, buyThreshold) {
	// Extract the close prices from the kline data
	const closePrices = klineData.map((item) => item.close);

	// Calculate the upper and lower Bollinger Bands using the calculateBollingerBands function
	const bands = calculateBollingerBands(colsePrices, period, deviation)

	// Calculate the required indicators using TA-Lib
	const [_, upperBand, lowerBand] = talib.BBANDS(closePrices);

// Iterate through the close prices and calculate the investment amount for each period
	let investmentAmount = initialInvestment;
	let totalBoughtAmount = 0;
	const buySignals = [];
	const investmentAmounts = [];

	for (let i = 0; i < closePrices.length; i++) {
		const closePrice = closePrices[i];
		const upperBollingerBand = upperBand[i];
		const lowerBollingerBand = lowerBand[i];

		if (closePrice < lowerBollingerBand - buyThreshold * upperBollingerBand) {
			const maxInvestment = initialInvestment * maxInvestmentPercentage / 100;
			const remainingInvestment = maxInvestment - totalBoughtAmount;

			const buyAmount = Math.min(investmentAmount, remainingInvestment, closePrice);
			const boughtCoins = buyAmount / closePrice;

			totalBoughtAmount += buyAmount;
			investmentAmounts.push(buyAmount);
			buySignals.push({
				timestamp: klineData[i].timestamp,
				price: closePrice,
				amount: boughtCoins
			});
		} else {
			investmentAmounts.push(0);
		}
	}

	return {
		investmentAmounts,
		buySignals
	};
}

// Function to retrieve kline data from user input
function getKlineData() {
	return new Promise((resolve) => {
		rl.question('Enter the kline data in the format: {timestamp: 1, close: 10} (type "done" when finished): ', (input) => {
			const klineData = [];
			while (input !== 'done') {
				try {
					const obj = JSON.parse(input);
					klineData.push(obj);
				} catch (error) {
					console.error('Invalid input format. Please try again.');
				}
				input = rl.question();
			}
			resolve(klineData);
		});
	});
}

// Function to get user input for parameters
function getUserInput() {
	return new Promise((resolve) => {
		rl.question('Enter the initial investment amount in USDT: ', (initialInvestment) => {
			rl.question('Enter the maximum investment percentage of the initial investment: ', (maxInvestmentPercentage) => {
				rl.question('Enter the buy threshold as a percentage of the upper Bollinger Band: ', (buyThreshold) => {
					resolve({
						initialInvestment: parseFloat(initialInvestment),
						maxInvestmentPercentage: parseFloat(maxInvestmentPercentage),
						buyThreshold: parseFloat(buyThreshold),
					});
				});
			});
		});
	});
}

// Main function to execute the program
async function runProgram() {
	console.log('Welcome to the Dynamic DCA Calculator!\n');

	const klineData = await getKlineData();
	const userInput = await getUserInput();

	const dynamicDCA = calculateDynamicDCA(
		klineData,
		userInput.initialInvestment,
		userInput.maxInvestmentPercentage,
		userInput.buyThreshold
	);

	console.log(dynamicDCA);

	rl.close();
}

// Run the program
runProgram();
