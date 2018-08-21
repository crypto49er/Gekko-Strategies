// Candlesticks
// 
// This strategy will send out a message
// if the previous candle matches a spinning 
// top, a high wave, a doji, a long day candle,
// a hangman, a shooting star or a hammer.

// You need to set the support and resistance
// level so this strat knows where these candles
// are in relation to these levels.

var log = require('../core/log');
var config = require('../core/util.js').getConfig();

// Let's create our own strat
var strat = {};

var largestCandle = {
  open: 0.0,
  close: 0.0,
  length: 0.0
}

var candleLength = 0;
var upperShadow = 0;
var lowerShadow = 0;
var lastThreeTrend = '';
var message = '';

var candles = [];

// Prepare everything our method needs
strat.init = function() {
  this.input = 'candle';
  this.requiredHistory = 100;
  this.resistance = config.candlesticks.resistance;
  this.support = config.candlesticks.support;
}

// What happens on every new candle?
strat.update = function(candle) {
  // check if candle is open or close
  if (candle.close > candle.open) { // open candle
    candleLength = candle.close - candle.open;
    upperShadow = candle.high - candle.close;
    lowerShadow = candle.open - candle.low;

  } else {                          // close candle
    candleLength = candle.open - candle.close; 
    upperShadow = candle.high - candle.open;
    lowerShadow = candle.close - candle.low;
  }

  // Store current candle as largest if candle length greater than largest candle
  if (candleLength > largestCandle.length) {
    largestCandle.open = candle.open;
    largestCandle.close = candle.close;
    largestCandle.length = candleLength;
  }

  candles.push(candle);

  if (candles.length > 10) {
    candles.shift();
  }

}

// Based on the newly calculated
// information, check if we should
// update or not.
strat.check = function(candle) {

  message = candle.close + ' ';

  // Spinning Top - 1/4 the size of the largest candle
  if (candleLength < largestCandle.length * 0.25) {

      if (candles[6].close <= candles[7].close && candles[7].close <= candles[8]) {
        lastThreeTrend = 'up';
      }
      if (candles[8].close <= candles[7].close && candles[7].close <= candles[6]) {
        lastThreeTrend = 'down';
      }

      // High Wave - Spinning Top with extra long upper and lower shadows

      // Doji - Open and close almost the same price

      // Dragonfly Doji - Doji with extremely long lower shadow, very strong bullish
      // signal if at support level

      // Tombstone Doji - Doji with extremely long upper shadow, 

      // Hangman - Previous 3 candles are open candles, current candle is a spinning top
      // with lower shadow 2x or greater than body

      // Shooting star - Previous 3 candles are open candles, current candle is a spinning top
      // with upper shadow 2x or greater than body

      // Hammer - Previous 3 candles are close candles, current candle is a spinning top 
      // with lower shadow 2x or greater than body

      if (candleLength < upperShadow * 1.5 && candleLength < lowerShadow * 1.5){
        message = message + 'High Wave Candle spotted';
      }  else if (candleLength < largestCandle.length * 0.02) { 
        if (lowerShadow > candleLength * 5 && upperShadow < candleLength) {
          message = message + 'Dragonfly Doji spotted';
        } else if (upperShadow > candleLength * 5 && lowerShadow < candleLength) {
          message = message + 'Tombstone Doji spotted';
        } else {
          message = message + 'Doji spotted';
        }
      } else if (candleLength < lowerShadow * 0.5) { // lower shadow 2x or larger than body
          if (lastThreeTrend == 'up') {
            message = message + 'Hangman spotted';
          }
          if (lastThreeTrend == 'down') {
            message = message + 'Hammer spotted';
          }
      } else if (candleLength < upperShadow * 0.5 && lastThreeTrend == 'up') {
        message = message + 'Shooting Star spotted';
      } else { 
        message = message + 'Spinning Top spotted';
      }
  }

  // Long Day Candle - 90% of the largest candle or greater
  if (candleLength >= largestCandle.length * 0.9) {
    if (upperShadow < candleLength * 0.01 && lowerShadow < candleLength * 0.01) {
      message = message + 'Marubozu Candle spotted';
    } else {
      message = message + 'Long Day Candle spotted';
    } 
  }
  
  // Report if candles are within 10% range of resistance or support,
  // indicating a strong signal
  if (candle.close * 0.9 < this.support) {
    message = message + '\nCandle within 10% range of support';
  }
  if (candle.close * 1.1 > this.resistance) {
    message = message + '\nCandle within 10% range of resistance';
  }

  log.info(message);
  message = '';

}

module.exports = strat;
