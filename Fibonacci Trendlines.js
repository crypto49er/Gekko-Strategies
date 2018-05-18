/*

  Fibonacci Trendlines - Crypto49er 2018-04-24

  This strategy uses the golden cross of the Fibonacci Trendlines (8 EMA and 21 EMA cross 
  over the 55 EMA) and as a buy signal. It will sell if the 21 cross below the 55 EMA. 

 */
// helpers
var _ = require('lodash');
var log = require('../core/log.js');
var buyPrice = 0.0;
var advised = false;

// let's create our own method
var method = {};

// prepare everything our method needs
method.init = function() {
  this.name = 'Fibonacci Trendlines';

  this.currentTrend;
  this.requiredHistory = this.settings.longSize;

  log.debug("Short EMA size: "+this.settings.shortSize);
  log.debug("Long EMA size: "+this.settings.longSize);

  this.addTalibIndicator('shortEMA', 'ema', {optInTimePeriod : this.settings.shortSize});
  this.addTalibIndicator('mediumEMA', 'ema', {optInTimePeriod : this.settings.mediumSize});
  this.addTalibIndicator('longEMA', 'ema', {optInTimePeriod : this.settings.longSize});

  log.debug(this.name+' Strategy initialized');

}

// what happens on every new candle?
method.update = function(candle) {
  // nothing!
}

// for debugging purposes: log the last calculated
// EMAs and diff.
method.log = function() {


}

method.check = function(candle) {

  var shortResult = this.talibIndicators.shortEMA.result.outReal;
  var mediumResult = this.talibIndicators.mediumEMA.result.outReal;
  var longResult = this.talibIndicators.longEMA.result.outReal;
  var currentPrice = candle.close;


    if(shortResult > mediumResult && mediumResult > longResult && !advised){
        // Display close price in terminal
      log.debug('____________________________________');
      log.debug('candle time', candle.start);
      log.debug('candle close price:', candle.close);
      log.debug("Buying in at", currentPrice);
      log.debug('shortEMA:', shortResult);
      log.debug('longEMA:', longResult);
      buyPrice = candle.close;
      advised = true;
      this.advice('long');
    } 
  
      if(advised && mediumResult < longResult){
         // Display close price in terminal
        log.debug('____________________________________');
        log.debug('candle time', candle.start);
        log.debug('candle close price:', candle.close);
        log.debug("Selling at", currentPrice);
        log.debug('shortEMA:', shortResult);
        log.debug('longEMA:', longResult);
        advised = false;
        buyPrice = 0;
        this.advice('short');
     }
    


}

module.exports = method;
