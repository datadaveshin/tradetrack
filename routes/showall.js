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
// Build prices
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
Constants

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
let symbols = [];
console.log('HEYQQQQ@QQQQQQQQQ');

/**
* Constructor
*/
var Position = function(ticker, buyPrice, buyDate, numShares) {
  this.ticker = ticker,
  this.buyPrice = buyPrice,
  this.buyDate = buyDate,
  this.numShares = numShares
}

_.each(openArr, function(stock) {
    let newPos = new Position(stock.ticker, stock.buyPrice, stock.buyDate, stock.numShares)
    openPositions.push(newPos);
    symbols.push(newPos.ticker);
})

yahooFinance.snapshot({
  fields: FIELDS,
  symbols: symbols
}).then(function (result) {
  _.each(result, function (snapshot, symbolIndex) {
    // console.log(util.format('=== %s ===', symbol).cyan);
    console.log("\nStock#########################\n");
    console.log(JSON.stringify(snapshot, null, 2));
    openPositions[symbolIndex].name = snapshot.name;
    openPositions[symbolIndex].lastTradePriceOnly = snapshot.lastTradePriceOnly;
    openPositions[symbolIndex].change = snapshot.change;
    openPositions[symbolIndex].changeInPercent = snapshot.changeInPercent * 100;
    openPositions[symbolIndex].dividendYield = snapshot.dividendYield;
    openPositions[symbolIndex].peRatio = snapshot.peRatio;

    console.log("openPositions.name, snapshot.name", openPositions[symbolIndex].name, snapshot.name);
    console.log("openPositions: ", openPositions)
  });
});



// =============================================================================
// show showall page
router.get('/', function(req, res) {
  res.render('showall');
});
module.exports = router;
