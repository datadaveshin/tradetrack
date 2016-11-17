/* jshint esversion: 6 */
/* jshint devel: true */
/* jshint node: true */
/* jshint browser: true */
'use strict';

const boom  = require('boom');
const express = require('express');
const bcrypt = require('bcrypt-as-promised');
var knex = require('../db/knex');
var yahooFinance = require('yahoo-finance');
var _ = require('lodash');
const { camelizeKeys, decamelizeKeys } = require('humps');
// eslint-disable-next-line new-cap
const router = express.Router();

// =============================================================================
// Build open positions prices
/**
* Data for testing
*/
let openArr = [
  {ticker: "AAPL",
  buyPrice: 10,
  buyDate: 'Sep 23 2014',
  numShares: 200},

  {ticker: "GS",
  buyPrice: 14,
  buyDate: 'Sep 23 2014',
  numShares: 350},

  {ticker: "JPM",
  buyPrice: 10,
  buyDate: 'May 3 2014',
  numShares: 400},

  {ticker: "AMZN",
  buyPrice: 10,
  buyDate: 'Jun 16 2014',
  numShares: 100}
]

/**
FIELD codes
n: name
l1: lastTradePriceOnly
c1: change
p2: changeInPercent
y: dividendYield
r: peRatio
*/
let FIELDS = ['n', 'l1', 'c1', 'p2', 'y', 'r']
let openPositions = [];
let closedPositions = [];
let symbols = [];
let closedSymbols = [];
let quoteGSCP = "";
console.log('OPEN POSITIONS!!');

// =============================================================================
// Define Position class

// * This is for test data
// var Position = function(ticker, buyPrice, buyDate, numShares) {
//   this.ticker = ticker,
//   this.buyPrice = buyPrice,
//   this.buyDate = new Date(buyDate),
//   this.numShares = numShares
// }

var Position = function(userName, ticker, sharePrice, tradeDate, numShares) {
  this.userName = userName,
  this.ticker = ticker,
  this.sharePrice = sharePrice,
  this.tradeDate = new Date(tradeDate),
  this.numShares = numShares
}




// =============================================================================
// show all open positions for current user
router.get('/open', function(req, res) {
  openPositions = [];
  knex.select('users.id','user_name', 'ticker', 'share_price', 'trade_date', 'num_shares')
  .from('transactions')
  .join('users', 'transactions.user_id', 'users.id')
  .join('stocks', 'transactions.stock_id', 'stocks.id')
  .where('closed_flag', false)
  .then((rows) => {
    if (req.cookies['/token']) {
    //   const faves = camelizeKeys(rows);
    //   console.log("Robs Rows", rows);

      //<- BEGIN inserting code from old showall.js here

      // Build symbol (to get quotes) and open position arrays
      // * each for example data
    //   _.each(openArr, function(stock) {
    //       let newPos = new Position(stock.ticker, stock.buyPrice, stock.buyDate, stock.numShares)
    //       openPositions.push(newPos);
    //       symbols.push(newPos.ticker);
    //   })
      console.log("START");
    //   console.log("typeof rows", typeof rows);
    //   console.log("Array.isArray(rows)", Array.isArray(rows));
      _.each(rows, function(stock) {
        //   console.log("MIDDLE stockObj", stock);
        //   console.log("MIDDLE stock.id", stock.id);
        //   console.log("MIDDLE stock.user_name", stock.user_name);
          let newPos = new Position(stock.user_name, stock.ticker, stock.share_price, stock.trade_date, stock.num_shares)
        //   console.log("stuck here?")
          openPositions.push(newPos);
          symbols.push(newPos.ticker);
        //   console.log("openPositions in _.each", openPositions);
      })
      console.log("END");

      // Get realtime quotes
      yahooFinance.snapshot({
        fields: FIELDS,
        symbols: symbols
      }).then(function (result) {
        _.each(result, function (snapshot, symbolIndex) {
          let currPos = openPositions[symbolIndex];
          currPos.name = snapshot.name;
          currPos.lastTradePriceOnly = snapshot.lastTradePriceOnly;
          currPos.change = snapshot.change;
          currPos.changeInPercent = (snapshot.changeInPercent * 100).toFixed(2);
          currPos.glDollar = (Number(snapshot.lastTradePriceOnly * currPos.numShares) - Number(currPos.sharePrice * currPos.numShares)).toFixed(2);
        //   currPos.glChangeInPercent = snapshot.changeInPercent * 100;
          currPos.glInPercent = (currPos.glDollar/(Number(snapshot.lastTradePriceOnly * currPos.numShares)) * 100).toFixed(2);
          currPos.dividendYield = snapshot.dividendYield;
          currPos.peRatio = snapshot.peRatio;
          console.log("openPositions: ", openPositions)
        });
        res.render('showall', {openPositions: openPositions})
      });
      //<- END inserting code from old showall.js here
    } else {
      res.status(401);
      res.set('Content-Type', 'text/plain');
      res.send('Unauthorized');
    }

  }).catch((err) => {

    res.status(401).send(err);
  });
});




module.exports = router;
