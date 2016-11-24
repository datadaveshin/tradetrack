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
// used in POST route
function insertTrade(newTrade, res, ticker, snapshot) {
  delete newTrade.ticker;

  knex('transactions')
  .insert(decamelizeKeys(newTrade),
    ['id', 'user_id', 'stock_id', 'trade_date', 'num_shares', 'share_price',
    'commission', 'fees', 'direction', 'action'])
    .returning('*')
    .then((row) => {
      const trade = camelizeKeys(row[0]);
      console.log('NEW TRADE EXISTING STOCK: ', trade);
      res.render('confirm-trade', {ticker: ticker,
                                company: snapshot.name,
                                numShares: trade.numShares,
                                sharePrice: trade.sharePrice,
                                commission: trade.commission,
                                direction: trade.direction,
                                action: trade.action});
  });
}

// =============================================================================
// show input form for new transaction
router.get('/new', function(req, res) {
  console.log('COOKIE: ', req.cookies);
  if (req.cookies['/token']) {
    res.render('get-trade');
  } else {
    res.redirect('../token/login');
  }

});

// =============================================================================
// POST new transaction
router.post('/', (req, res, next) => {
  let userId = Number(req.cookies['/token'].split('.')[0]);

  let numShares = Number(req.body.numShares);
  let ticker = req.body.ticker;

  let newTrade = {
    userId: userId,
    ticker: ticker,
    tradeDate: req.body.tradeDate,
    numShares: numShares,
    sharePrice: Number(req.body.sharePrice),
    commission: Number(req.body.commission),
    fees: Number(req.body.fees),
    direction: req.body.direction,
    action: numShares > 0 ? 'BUY' : 'SELL'
  };

  knex('stocks').where('ticker', newTrade.ticker).returning('id').first()
  .then((checkStock) => {

  if (!checkStock) {
    yahooFinance.snapshot ({
      symbol: ticker,
      fields: ['n','p']
    }).then((snapshot) => {

      console.log('SNAPSHOT : ', snapshot);

      knex('stocks').insert({ticker: newTrade.ticker,
                            company_name: snapshot.name,
                            last_close_price: snapshot.previousClose})
      .returning('*')
      .then((stock) => {

        newTrade.stockId = stock[0].id;

      }).then(() => {

      insertTrade(newTrade, res, ticker, snapshot);

    }).catch(err => {
      console.log('POST ERROR: ', err);
      res.status(400).send(err);
    });
  });
  } else {
    yahooFinance.snapshot ({
      symbol: ticker,
      fields: ['n']
    }).then((snapshot) => {

      newTrade.stockId = checkStock.id;
      insertTrade(newTrade, res, ticker, snapshot);

    }).catch(err => {
      console.log('POST ERROR: ', err);
      res.status(400).send(err);
    });
  } // end if else

  });
});

// =============================================================================
// PUT - update transaction
router.put('/', (req, res, next) => {
  let userId = Number(req.cookies['/token'].split('.')[0]);
  let trxId = Number(req.query.id);

  knex('transactions')
    .where('user_id', userId)
    .where('id', trxId).first()
    .then((trx) => {
      if(trx) {

        const { tradeDate, direction } = req.body;
        let numShares = Number(req.body.numShares);
        let sharePrice = Number(req.body.sharePrice);
        let commission = Number(req.body.commission);
        let fees = Number(req.body.fees);

        const updateTrx = {};

        if (tradeDate) updateTrx.tradeDate = tradeDate;
        if (direction) updateTrx.direction = direction;
        if (numShares) updateTrx.numShares = numShares;
        if (sharePrice) updateTrx.sharePrice = sharePrice;
        if (commission) updateTrx.commission = commission;
        if (fees) updateTrx.fees = fees;


        return knex('transactions')
          .update(decamelizeKeys(updateTrx), '*')
          .where('id', trxId);

      } else {
        throw new Error('Transaction Not Found');
      }
    })
    .then((row) => {

      const trx = camelizeKeys(row[0]);

      delete trx.createdAt;
      delete trx.updatedAt;

      res.render('confirm-trx', {tradeDate: trx.tradeDate || '',
                                 direction: trx.direction || '',
                                 numShares: trx.numShares || '',
                                sharePrice: trx.sharePrice || '',
                                commission: trx.commission || '',
                                      fees: trx.fees || ''
                                  });
    })
    .catch((err) => {
      console.log('PUT ERROR: ', err);
      res.status(400).send(err);
    });
});

module.exports = router;
