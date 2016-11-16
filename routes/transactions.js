/* jshint esversion: 6 */
/* jshint devel: true */
/* jshint node: true */
/* jshint browser: true */
'use strict';

const boom  = require('boom');
const express = require('express');
const bcrypt = require('bcrypt-as-promised');
var knex = require('../db/knex');
const { camelizeKeys, decamelizeKeys } = require('humps');
// eslint-disable-next-line new-cap
const router = express.Router();
const yahooFinance = require('yahoo-finance');

// =============================================================================
// show input form for new transaction
router.get('/new', function(req, res) {
  res.render('trade');
});

// =============================================================================
// POST new transaction
router.post('/', (req, res, next) => {
  console.log('NEW TRANSACTION: ', req.body);

  let numShares = Number(req.body.numShares);
  let ticker = req.body.ticker.toUpperCase();

  let newTrade = {
    userId: 1,
    ticker: ticker,
    tradeDate: req.body.tradeDate,
    numShares: numShares,
    sharePrice: Number(req.body.sharePrice),
    commission: Number(req.body.commission),
    fees: Number(req.body.fees),
    direction: req.body.direction.toUpperCase(),
    action: numShares > 0 ? 'BUY' : 'SELL'
  };

  knex('stocks').where('ticker', newTrade.ticker).returning('id').first()
  .then((stock) => {
    console.log('STOCK: ', stock);

  if (!stock) {
    yahooFinance.snapshot ({
      symbol: ticker,
      fields: ['n','p']
    }).then((snapshot) => {

      console.log('SNAPSHOT : ', snapshot);

      knex('stocks').insert({ticker: newTrade.ticker},
                            {company_name: snapshot.name},
                            {last_close_price: snapshot.previousClose})
      .returning('id')
      .then((stock) => {

        newTrade.stockId = stock[0].id;
        delete newTrade.ticker;
        console.log('TRX TO INSERT: ', newTrade);
      }).then(() => {

        return knex('transactions')
        .insert(decamelizeKeys(newTrade),
        ['id', 'user_id', 'stock_id', 'tradeDate', 'numShares', 'sharePrice',
        'commission', 'fees', 'direction', 'action']);

      }).then((row) => {
        const trade = camelizeKeys(row[0]);
        console.log('NEW TRADE: ', trade);
        res.render('new-trade', trade);
    });

    }).catch(err => {
      console.log('POST ERROR: ', err);
      res.status(400).send(err);
    });

  } // end if

  });

});












module.exports = router;
