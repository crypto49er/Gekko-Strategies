/*

  MACD Momentum V7 - Crypto49er 2018-04-26

  *** This Strategy makes money during the bear market of 3/1 - 4/1/2018 ***

  Buy when MACD is > -0.5 and MACD > signal.

  Check next 15 bars after buy signal. if histogram switches back to negative and widens to -0.2, sell.
  
  Sell when MACD switches from positive to negative.

  Stop loss at 3%

  After stop loss, pause trading for 5 hours.

  If lowest price greater than current price (found new low price) or lowestMACD greater than current macd 
  (found new low macd), reset pause timer back to 5 hours.

  Issue: sideway trades kills profits and hurts a lot during bear market
  If two losing trades happen in 90 minutes, pause for 9 hours.

 */

// helpers
var _ = require('lodash');
var log = require('../core/log.js');
var buyPrice = 0.0;
var candleTime = new Object();
var candlePrice = 0.0;
var lastHistogramInNegative = false;
var lastMACDInNegative = false;
var histogramCheckCounter = 0;
var lowestPrice = 99999999;
var lowestMACD = 99999999;
var pauseTimer = 0;
var newLowMacdOrPriceFlag = false;
var previousDuration = 0;
var duration = 0;
var histArray = [];
var stopLossCounter = 0;
var losingTradesCounter = 0;



// let's create our own method
var method = {};

// prepare everything our method needs
method.init = function() {

  // how many candles do we need as a base
  // before we can start giving advice?
  this.requiredHistory = this.tradingAdvisor.historySize;

  // define the indicators we need
  this.addIndicator('macd', 'MACD', this.settings);
}

// what happens on every new candle?
method.update = function(candle) {

  var macd = this.indicators.macd.diff;
  var macdHistogram = this.indicators.macd.result;

  // Store candle time and price in global variables
  candleTime = candle.start;
  candlePrice = candle.close;

  histArray.push(macdHistogram);
  //log.debug(histArray);


  if(histArray.length > 10){
    histArray.shift();
  }

  if(pauseTimer > 0){
    pauseTimer--;
  }

  // if(newLowMacdOrPriceFlag && pauseTimer > 0){
  //   pauseTimer = 300;
  // }

//   if(lowestPrice > candlePrice){
//      lowestPrice = candlePrice;
//      newLowMacdOrPriceFlag = true;
//      log.debug('Time:', candleTime);
//      log.debug('new low price', lowestPrice);
//      log.debug('pause timer', pauseTimer);
//  } else {
//    newLowMacdOrPriceFlag = false;
//  }

//   if(lowestMACD > macd){
//      lowestMACD = macd;
//      newLowMacdOrPriceFlag = true;
//      log.debug('Time:', candleTime);
//      log.debug('new low macd', lowestMACD);
//      log.debug('pause timer', pauseTimer);
//   } else {
//     newLowMacdOrPriceFlag = false;
//   }


  if(buyPrice != 0){
    duration++;
  } else{
    duration = 0;
  }



  
}

// for debugging purposes: log the last calculated
// EMAs and diff.
method.log = function() {

}

method.check = function() {
  
  var macdHistogram = this.indicators.macd.result;
  var macd = this.indicators.macd.diff;
  var signal = this.indicators.macd.signal.result;
  var sum = histArray.reduce((previous, current) => current += previous);
  var avg = sum / histArray.length;

  if(pauseTimer == 0 && buyPrice == 0 && macd > signal && macd >= -0.7 && macdHistogram >= 0.5){
    buyPrice = candlePrice;
      histogramCheckCounter = 15;
      this.advice('long');
      log.debug('Time:', candleTime);
      log.debug('macd:', macd);
      log.debug('lowest macd', lowestMACD);
      log.debug('signal:', signal);
      log.debug('histogram:',macdHistogram);
      log.debug('bought at', buyPrice);
      log.debug('Average of last 10 histogram candles', avg);
      log.debug('__________________________________________');
    } else if(histogramCheckCounter > 0){
       histogramCheckCounter--;

    // TODO: Try if current price less than buy price sell, sell
    // when macd less than signal
      if (buyPrice != 0 && macd < -0.5){
          buyPrice = 0;
          pauseTimer = 60;
          this.advice('short');
          log.debug('Time:', candleTime);
          log.debug('macd:', macd);
          log.debug('lowest macd', lowestMACD);
          log.debug('signal:', signal);
          log.debug('histogram:',macdHistogram);
          log.debug('Average of last 10 histogram candles', avg);
          log.debug('histogram trending down. Sold at', candlePrice);
          log.debug('sold after', duration, 'minutes.');
          log.debug('------------------------------------------');
     }
        
    } else if(buyPrice !=0 && macd < 0 && !lastMACDInNegative && macd < signal){
      buyPrice = 0;
      this.advice('short');
      // if buy price less than equal to sell price, increment losing trades counter
      // if duration is less than 90 candles, set pauseTimer to duration * losing
      // trades counter. Else set losing trades counter to 0;
      // if(buyPrice <= candlePrice){
      //   losingTradesCounter++;
      //   if(duration < 90){
      //     pauseTimer = duration * losingTradesCounter;
      //   }
      // } else {
      //   losingTradesCounter = 0;
      // }


      log.debug('Time:', candleTime);
      log.debug('macd:', macd);
      log.debug('signal:', signal);
      log.debug('histogram:',macdHistogram);
      log.debug('Average of last 10 histogram candles', avg);
      log.debug('sold at', candlePrice);
      log.debug('sold after', duration, 'minutes.');
      log.debug('__________________________________________');
    } else if (buyPrice > candlePrice * 1.03) {
      // TODO: Every time you hit a stop loss, increase buy requirement for
      // MACD by 1. Slowly decrease it by 0.01 every candle.

      buyPrice = 0;
      pauseTimer = 300;
      stopLossCounter++;
      this.advice('short');
      log.debug('Time:', candleTime);
      log.debug('macd:', macd);
      log.debug('signal:', signal);
      log.debug('histogram:',macdHistogram);
      log.debug('Average of last 10 histogram candles', avg);
      log.debug('stop out at', candlePrice);
      log.debug('after', duration, 'minutes.');
      log.debug('Stop Loss #', stopLossCounter);
      log.debug('*****************************************');
    }


  if(macdHistogram < 0) {
  lastHistogramInNegative = true;
  } else {
    lastHistogramInNegative = false;
  }

  if(macd < 0) {
    lastMACDInNegative = true;
  } else {
    lastMACDInNegative = false;
  }

}

module.exports = method;