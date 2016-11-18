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
// Define Position class
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
  if (!req.cookies['/token']) {
    res.redirect('login');
  }
  let userId = Number(req.cookies['/token'].split('.')[0]);

  knex.select('transactions.id', 'users.id','user_name', 'ticker', 'share_price', 'trade_date', 'num_shares')
  .from('transactions')
  .join('users', 'transactions.user_id', 'users.id')
  .join('stocks', 'transactions.stock_id', 'stocks.id')
  .where('closed_flag', false)
  .where('users.id', userId)
  .then((rows) => {
    if (req.cookies['/token']) {
    //   console.log("Robs Rows", rows);
      // Build symbol (to get quotes) and open position arrays
      _.each(rows, function(stock) {
          let newPos = new Position(stock.user_name, stock.ticker, stock.share_price, stock.trade_date, stock.num_shares)

          openPositions.push(newPos);
          symbols.push(newPos.ticker);
      })

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
          currPos.glInPercent = (currPos.glDollar/(Number(snapshot.lastTradePriceOnly * currPos.numShares)) * 100).toFixed(2);
          currPos.dividendYield = snapshot.dividendYield;
          currPos.peRatio = snapshot.peRatio;
        });
        console.log("openPositions: ", openPositions)
        res.render('showall', {openPositions: openPositions})
      });
    } else {
      res.status(401);
      res.set('Content-Type', 'text/plain');
      res.send('Unauthorized');
    }
  }).catch((err) => {
    res.status(401).send(err);
  });
});

// =============================================================================
// show all closed positions for current user

router.get('/closed', function(req, res) {


  if (!req.cookies['/token']) {
    res.redirect('login');
  }

  let userId = Number(req.cookies['/token'].split('.')[0]);

  knex.select('transactions.id', 'users.id','user_name', 'ticker', 'share_price', 'trade_date', 'num_shares')
  .from('transactions')
  .join('users', 'transactions.user_id', 'users.id')
  .join('stocks', 'transactions.stock_id', 'stocks.id')
  .where('closed_flag', true)
  .where('users.id', userId)
  .orderBy('ticker') // Added to sort by ticker
  .then((rows) => {

    var closedTrx = [];

    for (var i = 0; i < rows.length; i++) {
      var newTrx = new Trx(rows[i].id, rows[i].user_name, rows[i].ticker,
        rows[i].share_price, rows[i].trade_date, rows[i].num_shares);

        closedTrx.push(newTrx);
    }

    if (req.cookies['/token']) {
    //   console.log(closedTrx);
      console.log("closedTrx.length", closedTrx.length);

      //<-- BEGIN Code to calc closed table-->

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
                                               buyAmount: record.buyPrice * record.numShares})
        } else if (record.numShares < 0) {
            buyVsSellObj[record.ticker].sells.push({sellDate: record.sellDate,
                                               sellSimpleDate: simpleDate(record.sellDate),
                                               sellShares: Number(record.numShares),
                                               sellPrice: Number(record.sellPrice),
                                               sellAmount: record.sellPrice * record.numShares})
        }
        // console.log("index = ", idx);
      })
      //   console.log("buyVsSellObj", buyVsSellObj);

      // Calculate balances
    //   let calcObj = {};
      let calcArr = [];
      let hypoFolioAmount = 10000;
      let origHypoFolioAmount = 10000;
      _.each(buyVsSellObj, function(item, key) {
        //   console.log("each item", item);
          console.log("each item.buys", item.buys);
        //   console.log("each item.buys.buyAmount", item.buys.buyAmount);
        //   calcObj.ticker = buyVsSellObj.ticker;
          let calcObj = {};
          calcObj.ticker = key;
          calcObj.buyAmount = item.buys.reduce(function(a, b){
              return a + b.buyAmount}, 0).toFixed(2)
          calcObj.sellAmount = item.sells.reduce(function(a, b){
                  return a + b.sellAmount}, 0).toFixed(2)
          calcObj.glAmount = ((Number(calcObj.sellAmount) + Number(calcObj.buyAmount)) * -1).toFixed(2);
          calcObj.glInPercent = (calcObj.glAmount / calcObj.buyAmount * 100).toFixed(2);
          if (item.buys.length > 1) {
              calcObj.buyDate = 'various'
          } else {
              calcObj.buyDate = item.buys[0].buySimpleDate;
          }
          if (item.sells.length > 1) {
              calcObj.sellDate = 'various'
          } else {
              calcObj.sellDate = item.sells[0].sellSimpleDate;
          }

          hypoFolioAmount += Number(calcObj.glAmount)
          calcObj.hypoFolioAmount = hypoFolioAmount
          calcObj.hypoFolioAmountPercent = (((hypoFolioAmount - origHypoFolioAmount) / origHypoFolioAmount)*100).toFixed(2);

          calcArr.push(calcObj)
      });
      //<-- END Code to calc closed table-->

    //   res.send(closedTrx);
    //   res.send(buyVsSellObj);
    //   res.send(calcObj);
      res.send(calcArr);
    } else {
      res.status(401);
      res.set('Content-Type', 'text/plain');
      res.send('Unauthorized');
    }

  }).catch((err) => {

    res.status(401).send(err);
  });
});

// =============================================================================
// show specified open position for current user
router.get('/:id', function(req, res) {
  var trxId = Number(req.params.id);
  if (!req.cookies['/token']) {
    res.redirect('login');
  }

  let userId = Number(req.cookies['/token'].split('.')[0]);


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
