// RSI + Candle 
// Created by Crypto49er
// Version 2 (Version 1 was made for my heavily modded version of Gekko, version 2 is for based version of Gekko)
//
// This strategy is designed for 5 minute candles.
// Idea 1: When RSI drops aggressively (>18 points) and goes way below 30 (< 12), there's an 
// excellent chance the price shoots back up and over 70 RSI. 
// Idea 2: When RSI drops below 30 and candle creates a hammer, it means the bears are 
// exhausted and immediate gains should occur in the new few candles.

// Buy when RSI < 12 and RSI dropped more than 18 points compared to previous 2 candles
// Buy when RSI < 30 and candle is a hammer
// Sell when RSI > 70 
// Sell when 1% stop loss

var log = require('../core/log');
var config = require ('../core/util.js').getConfig();

const CandleBatcher = require('../core/candleBatcher');
const RSI = require('../strategies/indicators/RSI.js');
const SMA = require('../strategies/indicators/SMA.js');

// Let's create our own strat
var strat = {};
var buyPrice = 0.0;
var currentPrice = 0.0;
var rsi5 = new RSI({ interval: 14 });
var sma5 = new SMA(200);
var advised = false;
var rsi5History = [];
var wait = 0;
var counter = 0;
var disableTrading = false;
var waitForRejectedRetry = 0;
var priceHistory = [];
var sma5History = [];
var highestRSI = 0; // highestRSI in last 5 candles
var candle5 = {};

// Prepare everything our method needs
strat.init = function() {
  this.requiredHistory = config.tradingAdvisor.historySize;

  // since we're relying on batching 1 minute candles into 5 minute candles
  // lets throw if the settings are wrong
  if (config.tradingAdvisor.candleSize !== 1) {
    throw "This strategy must run with candleSize=1";
  }

  // create candle batchers for 5 minute candles
  this.batcher5 = new CandleBatcher(5);

  // supply callbacks for 5 minute candle function
  this.batcher5.on('candle', this.update5);


  // Add an indicator even though we won't be using it because
  // Gekko won't use historical data unless we define the indicator here
  this.addIndicator('rsi', 'RSI', { interval: this.settings.interval});
}

// What happens on every new candle?
strat.update = function(candle) {
  currentPrice = candle.close;

  // write 1 minute candle to 5 minute batchers
  this.batcher5.write([candle]);
  this.batcher5.flush();

  // Send message 
  counter++;
  if (counter == 1440){
    log.remote('Bot is still working.');
    counter = 0;
  }

  // Decrement wait
  if (wait > 0) {
    wait--;
    log.debug('Wait: ', wait);
  }

}

strat.update5 = function(candle) {
  rsi5.update(candle);
  sma5.update(candle.close);

  candle5 = this.batcher5.calculatedCandles[0];
  //log.debug('5 minute candle.close ', candle5.close);

  // Store the last three 5 minute candle prices
  priceHistory.push(candle.close);
  if (priceHistory.length > 10) {
    priceHistory.shift();
  }

  // Store the last three sma5 prices
  sma5History.push(sma5.result);
  if (sma5History.length > 3) {
    sma5History.shift();
  }

  // We only need to store RSI for 10 candles
  rsi5History.push(rsi5.result);
  if (rsi5History.length > 10) {
    rsi5History.shift();
  }

  highestRSI = 0;
  for (i=5;i<=rsi5History.length-1;i++){
    if(rsi5History[i] > highestRSI) {
      highestRSI = rsi5History[i];
    }
  }
  
  //Send price and RSI to console every 5 minutes
  //log.info('Price', currentPrice, 'SMA', sma5.result, 'RSI', rsi5.result.toFixed(2));
}

// Based on the newly calculated
// information, check if we should
// update or not.
strat.check = function() {

  // Buy when RSI < 12 and RSI dropped more than 18 points compared to previous 2 candles
  if (rsi5.result < 12 && (rsi5History[7] > rsi5.result + 18 || rsi5History[8] > rsi5.result + 18 ) && !advised && !disableTrading){
      this.buy('Buy because RSI less than 12');
  }

  
  // //Buy when RSI < 30 and candle is a hammer
  if (rsi5.result < 30 && candle5.open > candle5.low && candle5.open - candle5.low > candle5.low * 0.006 && candle5.open > candle5.close && (candle5.open - candle5.close)/(candle5.open - candle5.low) < 0.25 && !advised && !disableTrading){
    this.buy('Buy because RSI less than 30 and candle is a hammer');
  }

  // Sell when RSI > 70
  if (rsi5.result > 70 && advised) {
    this.sell('Take Profit - RSI past 70');
  }

  // Sell if currentPrice <= buyPrice * 0.99 (1% stop loss)
  if (currentPrice <= buyPrice * 0.99 && advised){
    this.sell('Stop Loss - 1% loss');
  } 

}

strat.sell = function(reason) {
  this.advice('short');
  log.info(reason);
  advised = false;
  buyPrice = 0;
}

strat.buy = function(reason) {
  this.advice('long');
  log.info(reason);
  advised = true;
  buyPrice = currentPrice;
}

strat.onCommand = function(cmd) {
  var command = cmd.command;
  if (command == 'start') {
      cmd.handled = true;
      cmd.response = "Hi. I'm Gekko. Ready to accept commands. Type /help if you want to know more.";
  }
  if (command == 'status') {
      cmd.handled = true;
      cmd.response = config.watch.currency + "/" + config.watch.asset +
      "\nPrice: " + currentPrice +
      "\nRSI: " + rsi5.result.toFixed(2) +
      "\nRSI History: " + rsi5History[7].toFixed(2) + ", " + rsi5History[8].toFixed(2) + ", " + rsi5History[9].toFixed(2);
  }
  if (command == 'help') {
  cmd.handled = true;
      cmd.response = "Supported commands: \n\n /buy - buy at next candle" + 
      "\n /sell - sell at next candle " + 
      "\n /status - show RSI and current portfolio" +
      "\n /stop - disable buying";
    }
  if (command == 'buy') {
  cmd.handled = true;
  this.buy('Manual buy order from telegram');
  }
  if (command == 'sell') {
  cmd.handled = true;
  this.sell('Manual sell order from telegram');
  }
  if (command == 'stop') {
    cmd.handled = true;
    if (cmd.arguments == 'true') {
      disableTrading = true;
      cmd.response = 'Gekko disabled from buying.';
    }
    if (cmd.arguments == 'false') {
      disableTrading = false;
      cmd.response = 'Gekko buying enabled.';
    }
  }
}



module.exports = strat;
