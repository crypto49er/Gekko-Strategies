/*

  StepGains - Crypto49er 2018-04-21

 */
// helpers
var _ = require('lodash');
var log = require('../core/log.js');
var watchPrice = 0.0;
var lowestPrice = 0.0;
var sellPrice = 0.0;
var advised = false;

// Let's create our own buy and sell strategy 
var strat = {};

// Prepare everything our strat needs
strat.init = function() {
    // how many candles do we need as a base
  // before we can start giving advice?
  this.requiredHistory = this.tradingAdvisor.historySize;
}

// What happens on every new candle?
strat.update = function(candle) {
  // Display close price in terminal
  log.debug('candle time', candle.start);
  log.debug('candle close price:', candle.close);
}

// For debugging purposes.
strat.log = function() {

}

// Based on the newly calculated
// information, check if we should
// update or not.
strat.check = function(candle) {

    if(watchPrice == 0){
        watchPrice = candle.close * 0.98;
    }
    if(candle.close <= watchPrice){
        lowestPrice = candle.close;
    }
    if(candle.close > lowestPrice && !advised){
        this.advice("long");
        log.debug('Buying at', candle.close);
        sellPrice = candle.close * 1.03;
        advised = true;
    }
    if(candle.close > sellPrice && watchPrice != 0 && lowestPrice != 0){
        this.advice("short");
        log.debug('Selling at', candle.close);
        watchPrice = 0;
        lowestPrice = 0;
        buyPrice = 0;
        sellPrice = 0;
        advised = false;
    }

}

module.exports = strat;