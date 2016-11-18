'use strict';
/* jshint esversion: 6 */
/* jshint devel: true */
/* jshint node: true */

// =============================================================================
// trx class definition
var Trx = function(trxId, userId, userName, ticker, sharePrice, tradeDate, numShares) {

  numShares = Number(numShares);

  this.trxId = trxId;
  this.userId = userId;
  this.userName = userName;
  this.ticker = ticker;
  this.buyPrice = numShares > 0 ? Number(sharePrice) : null;
  this.buyDate = numShares > 0 ? tradeDate : null;
  this.sellPrice = numShares < 0 ? Number(sharePrice) : null;
  this.sellDate = numShares < 0 ? tradeDate : null;
  this.numShares = numShares;
};


module.exports = {
  Trx: Trx
};
