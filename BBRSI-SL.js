/*

 BB strategy - okibcn 2018-01-03
 With Stop Loss - Crypto49er 2018-05-03

*/
// helpers
var _ = require('lodash');
var log = require('../core/log.js');

var BB = require('./indicators/BB.js');
var rsi = require('./indicators/RSI.js');
var rsiLong = require('./indicators/RSI.js');


var advised = false;
var buyPrice = 0.0;
var slTriggered = false;

// let's create our own method
var method = {};

// prepare everything our method needs
method.init = function () {
 this.name = 'BB';
 this.nsamples = 0;
 this.trend = {
   zone: 'none',  // none, top, high, low, bottom
   duration: 0,
   persisted: false
 };

 this.requiredHistory = this.tradingAdvisor.historySize;

 // define the indicators we need
 this.addIndicator('bb', 'BB', this.settings.bbands);
 this.addIndicator('rsi', 'RSI', this.settings);
 this.addIndicator('rsiLong', 'RSI', { interval: 96 });
}


// for debugging purposes log the last
// calculated parameters.
method.log = function (candle) {
 // var digits = 8;
 // var BB = this.indicators.bb;
 // //BB.lower; BB.upper; BB.middle are your line values 

 // log.debug('______________________________________');
 // log.debug('calculated BB properties for candle ', this.nsamples);

 // if (BB.upper > candle.close) log.debug('\t', 'Upper BB:', BB.upper.toFixed(digits));
 // if (BB.middle > candle.close) log.debug('\t', 'Mid   BB:', BB.middle.toFixed(digits));
 // if (BB.lower >= candle.close) log.debug('\t', 'Lower BB:', BB.lower.toFixed(digits));
 // log.debug('\t', 'price:', candle.close.toFixed(digits));
 // if (BB.upper <= candle.close) log.debug('\t', 'Upper BB:', BB.upper.toFixed(digits));
 // if (BB.middle <= candle.close) log.debug('\t', 'Mid   BB:', BB.middle.toFixed(digits));
 // if (BB.lower < candle.close) log.debug('\t', 'Lower BB:', BB.lower.toFixed(digits));
 // log.debug('\t', 'Band gap: ', BB.upper.toFixed(digits) - BB.lower.toFixed(digits));

 // var rsi = this.indicators.rsi;

 // log.debug('calculated RSI properties for candle:');
 // log.debug('\t', 'rsi:', rsi.result.toFixed(digits));
 // log.debug('\t', 'price:', candle.close.toFixed(digits));
}

method.check = function (candle) {
 var BB = this.indicators.bb;
 var price = candle.close;
 this.nsamples++;

 var rsi = this.indicators.rsi;
 var rsiVal = rsi.result;

 var rsiLong = this.indicators.rsiLong;
 var rsiLongVal = rsiLong.result;
 

 // price Zone detection
 var zone = 'none';
 if (price >= BB.upper) zone = 'top';
 if ((price < BB.upper) && (price > BB.middle * 1.01)) zone = 'high';
 if ((price <= BB.middle * 1.1) && (price >= BB.middle * 0.9)) zone = 'middle';
 if ((price > BB.lower) && (price < BB.middle * 0.99)) zone = 'low';
 if (price <= BB.lower) zone = 'bottom';
 log.debug('current zone:  ', zone);
 log.debug('current trend duration:  ', this.trend.duration);

 if (this.trend.zone == zone) {
   this.trend = {
     zone: zone,  // none, top, high, low, bottom
     duration: this.trend.duration+1,
     persisted: true
   }
 }
 else {
   this.trend = {
     zone: zone,  // none, top, high, low, bottom
     duration: 0,
     persisted: false
   }
 }

 if (slTriggered){
  if (!advised && price >= BB.middle && rsiVal >= this.settings.thresholds.high) slTriggered = false;
 } else {
  if (!advised && price <= BB.lower && rsiVal <= this.settings.thresholds.low && this.trend.duration >= this.settings.thresholds.persistence) {
    this.advice('long');
    log.debug("Bought at", candle.close);
    log.debug('Date', candle.start);
    log.debug('RSI', rsiVal, 'RSI Long', rsiLongVal);
 
    advised = true;
    buyPrice = candle.close;
 
  }
 }

 if (advised && price >= BB.middle && rsiVal >= this.settings.thresholds.high) {
  this.advice('short');
  log.debug('Date', candle.start);
  log.debug("Sold at", candle.close);
  log.debug('RSI', rsiVal, 'RSI Long', rsiLongVal);
  advised = false;


}

if (advised && buyPrice > candle.close * (1 + this.settings.stoploss.percentage * .01)){
  log.debug('Date', candle.start); 
  log.debug("Stop loss triggered, sell at", candle.close);
  log.debug('RSI', rsiVal, 'RSI Long', rsiLongVal);
   this.advice('short');
   advised = false;
   slTriggered = true;
 }



 // this.trend = {
 //   zone: zone,  // none, top, high, low, bottom
 //   duration: 0,
 //   persisted: false


}

module.exports = method;

