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
var Trx = require('../models/trx.js').Trx;
const { camelizeKeys, decamelizeKeys } = require('humps');
// eslint-disable-next-line new-cap
const router = express.Router();

// =============================================================================
// Build open positions prices
/**
FIELD codes
n: name
l1: lastTradePriceOnly
p:
c1: change
p2: changeInPercent
y: dividendYield
r: peRatio
*/
let FIELDS = ['n', 'l1', 'p', 'c1', 'p2', 'y', 'r'];
let openPositions = [];
let closedPositions = [];
let symbols = [];
let closedSymbols = [];
let quoteGSCP = "";
// console.log('OPEN POSITIONS!!');

// Datetime to simple date converter
function simpleDate(date) {
    var d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
}

// =============================================================================
// display formats
let sharePriceFmt = new Intl.NumberFormat("en-US",
                        { style: "currency", currency: "USD",
                          minimumFractionDigits: 4 });



// =============================================================================
// Define Position class
var Position = function(trxId, userName, ticker, sharePrice, tradeDate, numShares) {
  this.trxId = trxId,
  this.userName = userName,
  this.ticker = ticker,
  this.sharePrice = sharePrice,
  this.tradeDate = new Date(tradeDate),
  this.numShares = numShares
};

// =============================================================================
// show all open positions for current user
router.get('/open', function(req, res) {
  openPositions = [];
  symbols = [];

  if (!req.cookies['/token']) {
    res.redirect('../token/login');
  } else {
    let userId = Number(req.cookies['/token'].split('.')[0]);

    knex.select('transactions.id as trx_id', 'users.id','user_name', 'ticker', 'share_price', 'trade_date', 'num_shares')
    .from('transactions')
    .join('users', 'transactions.user_id', 'users.id')
    .join('stocks', 'transactions.stock_id', 'stocks.id')
    .where('closed_flag', false)
    .where('users.id', userId)
    .then((rows) => {
      // console.log('OPEN POSITIONS: ', rows);

      if (rows.length < 1) {
        res.render('no-positions', {status: 'open'});
      }

      if (req.cookies['/token']) {
        // Build symbol (to get quotes) and open position arrays
        _.each(rows, function(stock) {
            let newPos = new Position(stock.trx_id, stock.user_name, stock.ticker, stock.share_price, stock.trade_date, stock.num_shares);
            openPositions.push(newPos);
            symbols.push(newPos.ticker);
        });

        // Get realtime quotes
        yahooFinance.snapshot({
          fields: FIELDS,
          symbols: symbols
        }).then(function (result) {

          _.each(result, function (snapshot, symbolIndex) {
            let currPos = openPositions[symbolIndex];
            currPos.name = snapshot.name;

            currPos.numShares = Math.floor(currPos.numShares);
            currPos.previousClose = snapshot.previousClose;

            currPos.lastTradePriceOnly = snapshot.lastTradePriceOnly;

            currPos.origVal = (Number(currPos.sharePrice) * currPos.numShares);

            currPos.val = (currPos.numShares * Number(snapshot.lastTradePriceOnly)).toFixed(2);
            currPos.change = snapshot.change;

            currPos.changeInPercent = (snapshot.changeInPercent * 100).toFixed(2);

            currPos.glDollar = (Number(snapshot.lastTradePriceOnly * currPos.numShares) - Number(currPos.sharePrice * currPos.numShares)).toFixed(2);

            currPos.glInPercent = (Number(currPos.glDollar)/(Number(snapshot.lastTradePriceOnly * currPos.numShares)) * 100).toFixed(2);

            currPos.glInPercent = (Number(currPos.glDollar)/(Number(currPos.sharePrice * currPos.numShares)) * 100).toFixed(2);

            currPos.dividendYield = snapshot.dividendYield;

            currPos.peRatio = snapshot.peRatio;
          });

          res.render('showall', {openPositions: openPositions});
        });



      } else {
        res.status(401);
        res.set('Content-Type', 'text/plain');
        res.send('Unauthorized');
      }
    }).catch((err) => {
      console.log(err);
    });
  }
});


// =============================================================================
// show all closed positions for current user

router.get('/closed', function(req, res) {

  if (!req.cookies['/token']) {
    res.redirect('../token/login');
  } else {
    let userId = Number(req.cookies['/token'].split('.')[0]);

    knex.select('transactions.id as trx_id', 'users.id','user_name', 'ticker', 'share_price', 'trade_date', 'num_shares')
    .from('transactions')
    .join('users', 'transactions.user_id', 'users.id')
    .join('stocks', 'transactions.stock_id', 'stocks.id')
    .where('closed_flag', true)
    .where('users.id', userId)
    .orderBy('trade_date') // Added to sort by ticker
    .then((rows) => {

      var closedTrx = [];

      if (rows.length < 1) {
        res.render('no-positions', {status: 'closed'});
      }

      for (var i = 0; i < rows.length; i++) {
        var newTrx = new Trx(rows[i].trx_id, rows[i].id, rows[i].user_name, rows[i].ticker,
          rows[i].share_price, rows[i].trade_date, rows[i].num_shares);

          closedTrx.push(newTrx);
      }

      if (req.cookies['/token']) {
      //   console.log(closedTrx);
        console.log("closedTrx.length", closedTrx.length);

        //<-- BEGIN Code to calc closed table-->
        let theUser = closedTrx[0].userId;

        // Assemble buy vs sell object
        let buyVsSellObj = {};
        _.each(closedTrx, function(record, idx) {
          // console.log(record.ticker)
          if (!(record.ticker in buyVsSellObj)) {
              buyVsSellObj[record.ticker] = {buys: [], sells: []};
          }
          if (record.numShares > 0) {
              buyVsSellObj[record.ticker].buys.push({buyDate: record.buyDate,
                                                 buySimpleDate: simpleDate(record.buyDate),
                                                 buyShares: Number(record.numShares),
                                                 buyPrice: Number(record.buyPrice),
                                                 buyAmount: record.buyPrice * record.numShares});
          } else if (record.numShares < 0) {
              buyVsSellObj[record.ticker].sells.push({sellDate: record.sellDate,
                                                 sellSimpleDate: simpleDate(record.sellDate),
                                                 sellShares: Number(record.numShares),
                                                 sellPrice: Number(record.sellPrice),
                                                 sellAmount: record.sellPrice * record.numShares});
          }
          // console.log("index = ", idx);
        });
        //   console.log("buyVsSellObj", buyVsSellObj);

        // Calculate balances


        var folioAmount = 10000;
        var origFolioAmount = 10000;
        var percentAcct = 0.10;

        var statNumWinners = 0;
        var statNumLosers = 0;
        var calcArr = [];

        _.each(buyVsSellObj, function(item, key) {

            let calcObj = {};
            calcObj.ticker = key;
            calcObj.shares = item.buys.reduce(function(a, b){
                return a + Number(b.buyShares);}, 0);
            calcObj.buyAmount = item.buys.reduce(function(a, b){
                return a + b.buyAmount;}, 0).toFixed(2);
            calcObj.sellAmount = item.sells.reduce(function(a, b){
                    return a + b.sellAmount;}, 0).toFixed(2);
            calcObj.glAmount = ((Number(calcObj.sellAmount) + Number(calcObj.buyAmount)) * -1).toFixed(2);
            calcObj.glInPercent = (calcObj.glAmount / calcObj.buyAmount * 100).toFixed(2);
            if (item.buys.length > 1) {
                calcObj.buyDate = 'various';
            } else {
                calcObj.buyDate = item.buys[0].buySimpleDate;
            }
            if (item.sells.length > 1) {
                calcObj.sellDate = 'various';
            } else {
                calcObj.sellDate = item.sells[0].sellSimpleDate;
            }

          //   folioAmount = folioAmount + (Number(calcObj.glInPercent) / 100 * folioAmount * percentAcct) // Use to calc thetical total amount

            folioAmount += Number(calcObj.glAmount); // Use for real total amount

            calcObj.folioAmount = folioAmount.toFixed(2);
            calcObj.folioAmountPercent = (((folioAmount - origFolioAmount) / origFolioAmount)*100).toFixed(2);

            calcArr.push(calcObj);
            // console.log("CALC OBJ", calcObj);
        });

        // Calc some summary stats
        let statsObj = {};
        statsObj.beginningBal = origFolioAmount.toFixed(2);

        statsObj.endingBal = calcArr[calcArr.length - 1].folioAmount;

        statsObj.totalGl = (statsObj.endingBal - origFolioAmount).toFixed(2);

        statsObj.totalGlPercent = ((statsObj.endingBal - origFolioAmount) / origFolioAmount * 100).toFixed(1);

        statsObj.maxPortfolioGain = (Math.max(...calcArr.map(function(item) {return Number(item.folioAmount)})) - origFolioAmount).toFixed(2);

        statsObj.maxDrawDown = (Math.min(...calcArr.map(function(item) {return Number(item.folioAmount)})) - origFolioAmount).toFixed(2);

        statsObj.numTrades = calcArr.length;

        statsObj.numWinningTrades = _.filter(calcArr, function(item) {return Number(item.glAmount) > 0}).length;

        statsObj.numLosingTrades = _.filter(calcArr, function(item) {return Number(item.glAmount) < 0}).length;

        statsObj.numEvenTrades = calcArr.length - (statsObj.numWinningTrades + statsObj.numLosingTrades);

        statsObj.percentWinningTrades = (statsObj.numWinningTrades/statsObj.numTrades * 100).toFixed(1)

        statsObj.percentLosingTrades = (statsObj.numLosingTrades/statsObj.numTrades * 100).toFixed(1)


        statsObj.dollarWinnersArr = calcArr.filter(function(item) {return (Number(item.glAmount) > 0)}).map(function(item2){return Number(item2.glAmount)}).sort(function(a, b){return a - b});

        statsObj.dollarLosersArr = calcArr.filter(function(item) {return (Number(item.glAmount) < 0)}).map(function(item2){return Number(item2.glAmount)}).sort(function(a, b){return a - b}).reverse();

        statsObj.percentWinnersArr = calcArr.filter(function(item) {return (Number(item.glInPercent) > 0)}).map(function(item2){return Number(item2.glInPercent)}).sort(function(a, b){return a - b});

        statsObj.percentLosersArr = calcArr.filter(function(item) {return (Number(item.glInPercent) < 0)}).map(function(item2){return Number(item2.glInPercent)}).sort(function(a, b){return a - b}).reverse();

        statsObj.percentEvensArr = calcArr.filter(function(item) {return (Number(item.glInPercent) === 0)}).map(function(item2){return Number(item2.glInPercent)});

        statsObj.maxWinningDollar = Math.max(...statsObj.dollarWinnersArr).toFixed(2);
        statsObj.maxLosersDollar = Math.min(...statsObj.dollarLosersArr).toFixed(2);

        statsObj.maxWinnersPercent = Math.max(...statsObj.percentWinnersArr).toFixed(1);;
        statsObj.maxLosersPercent = Math.min(...statsObj.percentLosersArr).toFixed(1);;

        statsObj.aveWinnersPercent = (statsObj.percentWinnersArr.reduce(function(a, b) {return a + b}) / statsObj.percentWinnersArr.length).toFixed(1);

        statsObj.aveLosersPercent = (statsObj.percentLosersArr.reduce(function(a, b) {return a + b}) / statsObj.percentLosersArr.length).toFixed(1);

        //<-- END Code to calc closed table-->

        //<-- BEGIN Comment in and out for testing
      //   res.send(closedTrx);
      //   res.send(buyVsSellObj);
      //   res.send(calcArr);
      //   res.send(statsObj)
        res.render('closedall', {calcArr: calcArr, origFolioAmount: origFolioAmount, statsObj: statsObj})
        //<-- END Comment in and out for testing

      } else {
        res.status(401);
        res.set('Content-Type', 'text/plain');
        res.send('Unauthorized');
      }

    }).catch((err) => {

      console.log(err);
    });
  }
});

// =============================================================================
// show specified open position for current user
router.get('/:id', function(req, res) {
  var trxId = Number(req.params.id);
  console.log('trxId:', trxId);
  if (!req.cookies['/token']) {
    res.redirect('../token/login');
  }

  let userId = Number(req.cookies['/token'].split('.')[0]);
    console.log('userId:', userId);

  knex.select('users.id','user_name', 'ticker', 'share_price', 'trade_date', 'num_shares')
  .from('transactions')
  .join('users', 'transactions.user_id', 'users.id')
  .join('stocks', 'transactions.stock_id', 'stocks.id')
  .where('transactions.id', trxId)
  .where('users.id', userId)
  .then((rows) => {

    if (req.cookies['/token']) {
      console.log('SHOW ROW: ', rows);
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
