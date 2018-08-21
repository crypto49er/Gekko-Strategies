# Gekko-Strategies

A list of strategies I written up for the Gekko Trading Bot. These strategies are for educational purposes only! I do not know if they are profitable. As always, you should fully understand any strategy you use with the Gekko trading bot as you are responsible for the trades the bot makes for you. 

Candlesticks - A strategy that doesn't buy/sell, only tells you what candlestick pattern is when it closes.

Fibonacci Trendlines - A trading strategy that buys when 8 day and 21 day EMA is below the 55 day EMA 
and sell when the 8 day and 21 day is above the 55.

MACD Momentum - A trading strategy that tries to catch the bottom of the MACD curve and exits when MACD falls below 0. It is a WIP strategy and the code is extremely buggy (I gave up on perfecting when I saw how elegant the RSI Bull Bear strategy is) so it really should be use for references only. 

StepGains - My first strategy. It buys on a dip and sell when there is a 1% gain. The variables are hard coded so you can't change it in the UI. 
