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

let closedArr = [
    {ticker: "AAPL",
    openPrice: 10,
    openDate: 'Sep 23 2014',
    closePrice: 10,
    closeDate: 'Sep 23 2015',
    numShares: 200},

    {ticker: "GS",
    openPrice: 14,
    openDate: 'Sep 23 2014',
    closePrice: 14,
    closeDate: 'Sep 23 2015',
    numShares: 350},

    {ticker: "JPM",
    openPrice: 10,
    openDate: 'May 3 2014',
    closePrice: 10,
    closeDate: 'May 3 2015',
    numShares: 400},

    {ticker: "AMZN",
    openPrice: 10,
    openDate: 'Jun 16 2014',
    closePrice: 10,
    closeDate: 'Jun 16 2015',
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
let symbols = [];
let quoteGSCP = "";
console.log('HEYQQQQ@QQQQQQQQQ');

// =============================================================================
// Define Position class
var Position = function(ticker, buyPrice, buyDate, numShares) {
  this.ticker = ticker,
  this.buyPrice = buyPrice,
  this.buyDate = new Date(buyDate),
  this.numShares = numShares
}

// =============================================================================
// Build symbol (to get quotes) and open position arrays
_.each(openArr, function(stock) {
    let newPos = new Position(stock.ticker, stock.buyPrice, stock.buyDate, stock.numShares)
    openPositions.push(newPos);
    symbols.push(newPos.ticker);
})

// =============================================================================
// Get realtime quotes
yahooFinance.snapshot({
  fields: FIELDS,
  symbols: symbols
}).then(function (result) {
  _.each(result, function (snapshot, symbolIndex) {
    // console.log(util.format('=== %s ===', symbol).cyan);
    // console.log("\nStock#########################\n");
    // console.log(JSON.stringify(snapshot, null, 2));
    let currPos = openPositions[symbolIndex];
    currPos.name = snapshot.name;
    currPos.lastTradePriceOnly = snapshot.lastTradePriceOnly;
    currPos.change = snapshot.change;
    currPos.changeInPercent = snapshot.changeInPercent * 100;
    currPos.totalChange = (Number(snapshot.lastTradePriceOnly) - Number(currPos.buyPrice));
    currPos.totalChangeInPercent = snapshot.changeInPercent * 100;
    currPos.totalChangeInPercent = (currPos.totalChange/(Number(snapshot.lastTradePriceOnly)) * 100).toFixed(2);
    currPos.dividendYield = snapshot.dividendYield;
    currPos.peRatio = snapshot.peRatio;

    // console.log("openPositions: ", openPositions)
    // console.log("openPositions.name, snapshot.name", openPositions[symbolIndex].name, snapshot.name);
  });
});

var testDate = new Date('2016-11-16 11:52:06.230958-08')
console.log("testDate", testDate)
var testDate2 = new Date('2014-03-17 05:26:16-07')
console.log("testDate2", testDate2)

function formatDate(date) {
    var d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
}

console.log("testDate2 formatted", formatDate(testDate2));

// =============================================================================
// Get historical quote for ^GSPC
_.each(openPositions, function(position) {
  console.log("pos sym", position.ticker)
  yahooFinance.historical({
    symbol: "^GSPC",
    from: '2015-01-01',
    to: '2015-01-03',
    period: 'd'
  }).then(function (quotes) {
    // console.log("\n#$$$$$$$$ DIVIDER #######\n");
    // console.log(quotes)
    // console.log("\n#$$$$$$$$ DIVIDER #######\n");

    // position.ticker2 = position.ticker;
    // position.origBuyPrice = position.close;
    // console.log("openPositions: ", openPositions)
  });
})

yahooFinance.historical({
  symbol: "^GSPC",
  from: '2015-01-01',
  to: '2015-01-03',
  period: 'd'
}).then(function (quote) {
  // console.log("\n#$$$$$$$$ DIVIDER #######\n");
  // console.log(quotes)
  // console.log("\n#$$$$$$$$ DIVIDER #######\n");
  // console.log("yayay", quote)
  quoteGSCP = quote
  // position.ticker2 = position.ticker;
  // position.origBuyPrice = position.close;
  // console.log("openPositions: ", openPositions)
});

=============================================================================
// Build closed positions prices
/**
* Data for testing
*/
let closedArr = [
    {ticker: "AAPL",
    openPrice: 10,
    openDate: 'Sep 23 2014',
    closePrice: 10,
    closeDate: 'Sep 23 2015',
    numShares: 200},

    {ticker: "GS",
    openPrice: 14,
    openDate: 'Sep 23 2014',
    closePrice: 14,
    closeDate: 'Sep 23 2015',
    numShares: 350},

    {ticker: "JPM",
    openPrice: 10,
    openDate: 'May 3 2014',
    closePrice: 10,
    closeDate: 'May 3 2015',
    numShares: 400},

    {ticker: "AMZN",
    openPrice: 10,
    openDate: 'Jun 16 2014',
    closePrice: 10,
    closeDate: 'Jun 16 2015',
    numShares: 100}
]

=============================================================================
// Define closedPosition class
var Position = function(ticker, openPrice, openDate, numShares, closePrice, closeDate) {
  this.ticker = ticker,
  this.openPrice = openPrice,
  this.openDate = new Date(openDate),
  this.numShares = numShares,
  this.closePrice = closePrice,
  this.closeDate = closeDate,
}

=============================================================================
// Build symbol (to get quotes) and open position arrays
_.each(openArr, function(stock) {
    let newPos = new Position(stock.ticker, stock.buyPrice, stock.buyDate, stock.numShares)
    openPositions.push(newPos);
    symbols.push(newPos.ticker);
})




// =============================================================================
// show showall page
router.get('/', function(req, res) {
  console.log('last to go', openPositions, quoteGSCP)
  res.render('showall', {openPositions: openPositions, quoteGSCP: quoteGSCP});
});


module.exports = router;
